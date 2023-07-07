//@ts-check

import { WebSocketServer } from "ws";
import { getDatabase } from "../src/utils/mongo.mjs";

const wss = new WebSocketServer({
  port: 3030,
  host: "0.0.0.0",
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
  arr.forEach((uid) => {
    connections[uid]?.forEach((ws) => {
      ws.send(JSON.stringify(message));
    });
  });
}

wss.on("connection", (ws, request) => {
  console.log(
    `Accepting WebSocket connection from ${request.socket.remoteAddress}`
  );

  let uid = undefined;
  let partnerUid = undefined;

  ws.send(JSON.stringify({ action: "hello" }));

  ws.on("message", async (data) => {
    try {
      const message = JSON.parse(data.toString("utf-8"));
      console.log("Received", message);

      if (message.action) {
        if (message.action === "hello") {
          uid = message.uid;
          if (connections[uid] === undefined) {
            connections[uid] = [ws];
          } else {
            connections[uid].push(ws);
          }
          if (message.partnerUid) {
            partnerUid = message.partnerUid;
          }
        } else if (message.action === "update_partner") {
          partnerUid = message.partnerUid;
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
        } else if (message.action === "start") {
          console.log("Starting session for ", uid, " and ", partnerUid);
          // Insert a base "template" document for each user
          const db = await getDatabase();
          const coll = db.collection("stats");
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
          send([uid, partnerUid], { action: "start" });
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
          const db = await getDatabase();
          const coll = db.collection("stats");
          await coll.updateOne(
            {
              _id: uid,
            },
            {
              intervals: {
                $push: message.data,
              },
            }
          );
          if (!waitingOn.includes(partnerUid)) {
            // If we're not waiting on the other partner to supply data...
            // Finalize the switch by notifying both partners
            send([uid, partnerUid], {
              action: "switch",
              start: Date.now(),
            });
          }
        }
      } else {
        console.warn(`No action in WS message: ${message}`);
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
