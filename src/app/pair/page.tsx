"use client";

import { getUID, setPartnerUID } from "@/utils/react";
import { useContext, useEffect, useRef } from "react";
import { WebSocketContext } from "../layout";

export default function Page() {
  const id = getUID();
  const { sendJsonMessage, lastJsonMessage } = useContext(WebSocketContext)!;

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (lastJsonMessage && "action" in lastJsonMessage) {
      if (lastJsonMessage.action === "id" && lastJsonMessage.partnerUid) {
        // Partner IDs have been synced
        setPartnerUID(lastJsonMessage.partnerUid);
        console.log("Partner UIDs have been synced");
      }
    }
  }, [lastJsonMessage]);

  return (
    <main className="flex h-screen flex-col items-center justify-center">
      <div className="flex flex-col gap-4">
        <h1 className="text-center text-3xl font-bold">Begin</h1>
        <p className="mb-8 max-w-xs">
          Have one partner share their unique ID with the other partner and
          submit the form.
        </p>
        <div>
          <b>Enter your partner&apos;s ID</b>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendJsonMessage({
                action: "update_partner",
                partnerUid: inputRef.current!.value,
              });
            }}
            className="relative"
          >
            <input
              ref={inputRef}
              type="text"
              className="rounded-lg border border-gray-500 px-2"
            />
            <button className="absolute inset-y-0 right-0 rounded-r-lg border border-gray-500 bg-blue-500 px-3 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path
                  fillRule="evenodd"
                  d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </form>
        </div>
        <div>
          <b>Share your ID with your partner</b>
          <p>
            <code>{id}</code>
          </p>
        </div>
      </div>
    </main>
  );
}
