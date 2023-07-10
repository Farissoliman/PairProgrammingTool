"use client";

import { useContext } from "react";
import { Button } from "../components/Button";
import { WebSocketContext } from "../layout";

export default function Page() {
  const { sendJsonMessage } = useContext(WebSocketContext)!;

  return (
    <main className="flex h-screen flex-col items-center justify-center">
      <h1 className="text-3xl font-bold">Start</h1>
      <p>Do not start the session until instructed to do so.</p>
      <Button
        onClick={() => {
          sendJsonMessage({
            action: "start",
          });
        }}
      >
        Start Session
      </Button>
    </main>
  );
}
