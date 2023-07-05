//@ts-check

const { createServer } = require("http");
const next = require("next");
const { parse } = require("url");
const { WebSocketServer } = require("ws");

const dev = process.env.NODE_ENV !== "production";
const hostname = "127.0.0.1"; // IPv6 seems to be unsupported
const port = 3000;
// when using middleware `hostname` and `port` must be provided below

// @ts-ignore
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const wss = new WebSocketServer({
    noServer: true,
  });

  createServer(async (req, res) => {
    if (!req.url) {
      return res.end();
    }
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  })
    .on("upgrade", (request, socket, upgradeHead) => {
      if (!request.url) return;

      const parsedUrl = parse(request.url, true);
      if (!parsedUrl.pathname?.startsWith("/_next/")) {
        wss.handleUpgrade(request, socket, upgradeHead, (ws, req) => {
          wss.emit("connection", ws, req);
        });
      }
    })
    .listen(port, async () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });

  // A map from a user's UID to their current active WebSocket
  let connections = {};

  wss.on("connection", (ws, request) => {
    console.log(
      `Accepting WebSocket connection from ${request.socket.remoteAddress}`
    );

    let uid = undefined;
    let partnerUid = undefined;

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString("utf-8"));
        console.log(`Received ${message}`);

        if (message.action) {
          if (message.action === "id") {
            uid = message.uid;
            partnerUid = message.partnerUid;
            connections[uid] = ws;
          } else if (message.action === "switch") {
            // Request to switch driver and navigator
            if (partnerUid && connections[partnerUid]) {
              const payload = JSON.stringify({ action: "switch" });
              ws.send(payload);
              connections[partnerUid].send(payload);
            } else {
              ws.send(
                JSON.stringify({
                  error: "No partner specified, or they have disconnected",
                })
              );
            }
          }
        } else {
          console.warn(`No action in WS message: ${message}`);
        }
        console.log("[WS Received] ", message);
      } catch (e) {
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
});
