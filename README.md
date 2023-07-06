# PairProgrammingTool

## Run locally

This project requires a MongoDB database on the local machine running on port 27017.
The easiest way to do this is via Docker:

```sh
docker run --rm -p 27017:27017 mongo
```

Next, install dependencies:

```sh
npm install
```

Then, run the Next.js server with `npm run dev`.
In a different terminal, run the WebSocket server with `node server/ws_server.mjs`.

Next.js will take care of hot reloading for every file except for the WebSocket server.
For that, you can use `nodemon`: `npx nodemon server/ws_server.mjs`. This will restart
the WS server every time its code changes.
