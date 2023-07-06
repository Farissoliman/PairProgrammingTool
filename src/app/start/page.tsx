"use client";

import { getPartnerUID } from "@/utils/react";
import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";
import { Button } from "../components/Button";
import { WebSocketContext } from "../layout";

export default function Page() {
  const router = useRouter();
  const { sendJsonMessage, lastJsonMessage } = useContext(WebSocketContext)!;

  if (getPartnerUID() === null) {
    router.push("/pair");
  }

  useEffect(() => {
    if (lastJsonMessage && "action" in lastJsonMessage) {
      if (lastJsonMessage.action === "start") {
        // Partner IDs have been synced
        router.push("/stats");
      }
    }
  }, [lastJsonMessage]);

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
