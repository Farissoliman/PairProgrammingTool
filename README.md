# PairProgrammingTool

## Run locally

First, you need to set some environment variables. Create a file called `.env.local` and add the following:

```env
WS_SERVER_ADDRESS=ws://localhost:3030
```

Variables which are meant to be committed to the repository can be found in `.env.public`. The contents of `.env.local` should stay on your machine and _not_ be committed to this repo.

The easiest way to run locally is via Docker:

```sh
docker compose up
```

This will spin up a MongoDB database, the WebSocket server, and the frontend application, each in its own Docker container.

When you change the code, you can run `docker compose up --build`, which will take care of rebuilding the images for you.
