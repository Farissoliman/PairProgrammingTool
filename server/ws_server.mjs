//@ts-check

import { WebSocketServer } from "ws";
import { getDatabase } from "../src/utils/mongo.mjs";
import { spawn } from "child_process";

const wss = new WebSocketServer({
  port: 3030,
  host: "0.0.0.0",
});

// A map from a user's UID to a list of their current active WebSocket connections
let connections = {};

// A list of UIDs that the WS server is expecting data from.
let waitingOn = [];

let isEnded = false;

/**
 * @param {string | string[]} uids
 * @param {any} message
 */
function send(uids, message) {
  const arr = Array.isArray(uids) ? uids : [uids];
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
    // @ts-ignore
    _id: uid,
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
  const coll = await getCollection();
  await Promise.all([
    coll.updateOne(
      {
        _id: uid,
      },
      {
        $set: {
          partnerUid: partnerUid,
        },
      },
      { upsert: true }
    ),
    coll.updateOne(
      {
        _id: partnerUid,
      },
      {
        $set: {
          partnerUid: uid,
        },
      },
      { upsert: true }
    ),
  ]);
}

async function getCollection() {
  const db = await getDatabase();
  return db.collection("stats");
}

wss.on("connection", (ws, request) => {
  console.log(
    `Accepting WebSocket connection from ${request.socket.remoteAddress}`
  );

  let uid = undefined;

  ws.send(JSON.stringify({ action: "hello" }));

  ws.on("message", async (data) => {
    let partnerUid = uid ? await getPartner(uid) : undefined;

    try {
      const message = JSON.parse(data.toString("utf-8"));
      console.log("Received", message);

      if (!uid && !message.uid) {
        ws.send(
          JSON.stringify({
            error: "No UID specified or found from a previous interaction",
          })
        );
        return;
      }

      if (message.action) {
        if (message.action === "hello") {
          uid = message.uid;
          if (connections[uid] === undefined) {
            connections[uid] = [ws];
          } else {
            connections[uid].push(ws);
          }
          // Make sure the client is in the correct state
          const document = await (await getCollection()).findOne({ _id: uid });
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

          const argument = uid

          // Start python script
        //   const child = spawn('python', ['./recognition/run.py', argument]);
        //   child.stdout.on('data', function (data) {
        //     console.log('stdout: ' + data);
        //   });
        //   child.stderr.on('data', function (data) {
        //     console.log('stderr: ' + data);
        //   });
        //   child.on('close', function (code) {
        //     console.log('child process exited with code ' + code);
        //   });

          // Insert a base "template" document for each user
          const coll = await getCollection();
          coll.updateOne(
            {
              _id: uid,
            },
            {
              $set: {
                session_start: Date.now(),
                intervals: [],
                starting_status: "driver",
              },
            },
            { upsert: true }
          );
          coll.updateOne(
            {
              _id: partnerUid,
            },
            {
              $set: {
                session_start: Date.now(),
                intervals: [],
                starting_status: "navigator",
              },
            },
            { upsert: true }
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
              })
            );
          }
        } else if (message.action === "provide_data") {
          // Commit the data to the database
          waitingOn = waitingOn.filter((it) => it !== uid);
          const coll = await getCollection();
          const result = await coll.updateOne(
            {
              _id: uid,
            },
            {
              $push: {
                intervals: message.data,
              },
            }
          );
          if (result.modifiedCount === 0 && result.upsertedCount === 0) {
            console.warn(
              "User document wasn't updated! MongoDB returned result: " +
                JSON.stringify(result)
            );
          }
          if (!waitingOn.includes(partnerUid) && !isEnded) {
            // If we're not waiting on the other partner to supply data...
            // Finalize the switch by notifying both partners

            const newDriver =
              message.data.status === "driver" ? partnerUid : uid;
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
          // disconnect webserver and send disconnect message
          send([uid, partnerUid], { action: "end" });
        } else {
          console.warn(`No action in WS message: ${message}`);
        }
      }

      if (message.action === "hello" || message.action === "update_partner") {
        const partner = await getPartner(message.uid);
        partnerUid = partner;
        if (message.partnerUid) {
          await setPartner(uid, message.partnerUid);
          partnerUid = message.partnerUid;
        }
        if (partner || message.partnerUid) {
          console.log("Partners", uid, "and", partnerUid, "found.");
          // Send both sides an `id` message, telling them to allow the user to start the session.
          send(uid, {
            action: "id",
            uid,
            partnerUid,
          });
          send(message.partnerUid, {
            action: "id",
            uid: partnerUid,
            partnerUid: uid,
          });
        }
      }
    } catch (e) {
      console.log(e);
      ws.send(JSON.stringify({ error: "unknown" }));
    }
  });

  ws.on("close", (code, reason) => {
    console.log(`Connection closed (${code}) ${reason?.toString("utf-8")}`);
    if (uid) {
      connections[uid] = undefined;
      // TODO: let the partner know that this user disconnected
    }
  });
});

wss.on("listening", () => {
  console.log(`WebSocket server listening`);
});
