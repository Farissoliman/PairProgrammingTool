//@ts-check

import { spawn } from "child_process";
import { WebSocketServer } from "ws";

import { MongoClient } from "mongodb";

const DB_NAME = process.env.MONGODB_DB_NAME ?? "gendertool";

const client = new MongoClient(
  process.env.MONGO_CONNECTION_STRING ?? "mongodb://127.0.0.1:27017",
);
const conn = client.connect();
export const getDatabase = async () => (await conn).db(DB_NAME);

const wss = new WebSocketServer({
  port: parseInt(process.env.WS_SERVER_PORT ?? "3030"),
  host: "0.0.0.0",
});

process.once("SIGTERM", () => {
  console.log("Shutting down...");
  wss.close();
  client.close();
});

// A map from a user's UID to a list of their current active WebSocket connections
let connections = {};

// A list of UIDs that the WS server is expecting data from.
let waitingOn = [];

/**
 * @param {string | string[]} uids
 * @param {any} message
 */
function send(uids, message) {
  const arr = Array.isArray(uids) ? uids : [uids];
  if (uids === null) {
    throw new Error("No recipient for message");
  }
  arr.forEach((uid) => {
    connections[uid]?.forEach((ws) => {
      ws.send(JSON.stringify(message));
    });
  });
  console.log("Sent", message, "to", uids);
}

let partnerCache = new Map();

/**
 * @param {string} uid
 */
async function getPartner(uid) {
  if (partnerCache.has(uid)) return partnerCache.get(uid);
  const coll = await getCollection();
  const doc = await coll.findOne({
    userId: uid,
  });
  console.log("Getting partner for ", uid, " - Document:", doc);
  if (doc?.partnerUid) {
    partnerCache.set(uid, doc?.partnerUid);
    partnerCache.set(doc?.partnerUid, uid);
  }
  return doc?.partnerUid;
}

async function setPartner(uid, partnerUid) {
  if (!uid || !partnerUid) {
    throw new Error("Unexpected input: " + uid + ", " + partnerUid);
  }
  partnerCache.set(uid, partnerUid);
  partnerCache.set(partnerUid, uid);
  const coll = await getCollection();
  await Promise.all([
    coll.updateOne(
      {
        userId: uid,
      },
      {
        $set: {
          partnerUid: partnerUid,
        },
      },
      { upsert: true },
    ),
    coll.updateOne(
      {
        userId: partnerUid,
      },
      {
        $set: {
          partnerUid: uid,
        },
      },
      { upsert: true },
    ),
  ]);
}

async function getCollection() {
  const db = await getDatabase();
  return db.collection("stats");
}

wss.on("connection", (ws, request) => {
  console.log(
    `Accepting WebSocket connection from ${request.socket.remoteAddress}`,
  );

  let uid = undefined;
  let isEnded = false;

  ws.send(JSON.stringify({ action: "hello" }));

  ws.on("message", async (data) => {
    if (isEnded) {
      throw new Error("Session has ended");
    }

    let partnerUid = uid ? await getPartner(uid) : undefined;

    try {
      const message = JSON.parse(data.toString("utf-8"));
      console.log("Received", message);

      if (!uid && !message.uid) {
        throw new Error(
          'No UID specified or found from a previous interaction. Try clicking the "Reset" button.',
        );
      }

      if (message.action === "hello") {
        uid = message.uid;
        if (connections[uid] === undefined) {
          connections[uid] = [ws];
        } else {
          connections[uid].push(ws);
        }
        // Make sure the client is in the correct state
        const document = await (await getCollection()).findOne({ userId: uid });
        if (document?.session_start) {
          send(uid, {
            action: "start",
            status:
              document.intervals && document.intervals.length > 0
                ? document.intervals[document.intervals.length - 1].status
                : document.starting_status,
          });
        }
      } else if (message.action === "update_partner") {
        // Handled below
      } else if (message.action === "start") {
        console.log("Starting session for ", uid, " and ", partnerUid);

        const argument = uid;

        // Start python script
        const child = spawn("python", ["./recognition/run.py", argument]);
        child.stdout.on("data", function (data) {
          console.log("stdout: " + data);
        });
        child.stderr.on("data", function (data) {
          console.log("stderr: " + data);
        });
        child.on("close", function (code) {
          console.log("child process exited with code " + code);
        });

        // Insert a base "template" document for each user
        const coll = await getCollection();
        coll.updateOne(
          {
            userId: uid,
          },
          {
            $set: {
              session_start: Date.now(),
              intervals: [],
              starting_status: "driver",
            },
          },
          { upsert: true },
        );
        coll.updateOne(
          {
            userId: partnerUid,
          },
          {
            $set: {
              session_start: Date.now(),
              intervals: [],
              starting_status: "navigator",
            },
          },
          { upsert: true },
        );

        // Start the session for both partners
        send(uid, { action: "start", status: "driver" });
        send(partnerUid, { action: "start", status: "navigator" });
      } else if (message.action === "switch") {
        // Request data from both sides
        if (partnerUid && connections[partnerUid]) {
          waitingOn.push(uid, partnerUid);
          send([uid, partnerUid], { action: "request_data" });
        } else {
          ws.send(
            JSON.stringify({
              error: "No partner specified, or they have disconnected",
            }),
          );
        }
      } else if (message.action === "provide_data") {
        // Commit the data to the database
        waitingOn = waitingOn.filter((it) => it !== uid);
        const coll = await getCollection();
        const result = await coll.updateOne(
          {
            userId: uid,
          },
          {
            $push: {
              intervals: message.data,
            },
          },
        );
        if (result.modifiedCount === 0 && result.upsertedCount === 0) {
          console.warn(
            "User document wasn't updated! MongoDB returned result: " +
              JSON.stringify(result),
          );
        }
        if (!waitingOn.includes(partnerUid) && !isEnded) {
          // If we're not waiting on the other partner to supply data...
          // Finalize the switch by notifying both partners

          const newDriver = message.data.status === "driver" ? partnerUid : uid;
          const newNavigator =
            message.data.status === "navigator" ? partnerUid : uid;
          const start = Date.now();

          send(newDriver, {
            action: "switch",
            start,
            status: "driver",
          });
          send(newNavigator, {
            action: "switch",
            start,
            status: "navigator",
          });
        }
      } else if (message.action === "end") {
        isEnded = true;
        const coll = await getCollection();
        const finished = Date.now();
        await coll.updateOne(
          {
            userId: uid,
          },
          {
            $set: {
              session_end: finished,
            },
          },
        );
        await coll.updateOne(
          {
            userId: partnerUid,
          },
          {
            $set: {
              session_end: finished,
            },
          },
        );
        // disconnect webserver and send disconnect message
        send([uid, partnerUid], { action: "end" });
      } else {
        console.warn(`Nonexistant or invalid action in WS message: ${message}`);
      }

      if (message.action === "hello" || message.action === "update_partner") {
        const partnerUidFromDatabase = await getPartner(message.uid);
        partnerUid = partnerUidFromDatabase;
        if (message.partnerUid) {
          await setPartner(uid, message.partnerUid);
          partnerUid = message.partnerUid;
        }
        if (partnerUid) {
          console.log("Partners", uid, "and", partnerUid, "found.");
          // Send both sides an `id` message, telling them to allow the user to start the session.
          send(uid, {
            action: "id",
            uid,
            partnerUid,
          });
          send(partnerUid, {
            action: "id",
            uid: partnerUid,
            partnerUid: uid,
          });
          send(partnerUid, {
            action: "toast",
            message: "Your partner has connected."
          });
        }
      }
    } catch (e) {
      console.log(e);
      ws.send(JSON.stringify({ error: e.message ?? "Unknown" }));
    }
  });

  ws.on("close", async (code, reason) => {
    console.log(`Connection closed (${code}) ${reason?.toString("utf-8")}`);
    if (uid) {
      connections[uid] = undefined;

      const partnerUid = uid ? await getPartner(uid) : undefined;
      if (partnerUid) {
        send(partnerUid, { error: "Your partner has disconnected." });
      }
    }
  });
});

wss.on("listening", () => {
  console.log(`WebSocket server listening`);
});
