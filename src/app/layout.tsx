"use client";

import {
  AutoRouting,
  getPartnerUID,
  getUID,
  resetUID,
  setPartnerUID,
} from "@/utils/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outfit } from "next/font/google";
import Link from "next/link";
import { createContext, useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { JsonValue, WebSocketHook } from "react-use-websocket/dist/lib/types";
import "./globals.css";

const customFont = Outfit({ subsets: ["latin"] });

export const WebSocketContext = createContext<WebSocketHook<any> | null>(null);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());
  let id = getUID();

  const webSocketHook = useWebSocket(`ws://127.0.0.1:3030/ws`, {
    shouldReconnect: () => true,
    reconnectInterval: () => 500,
  });

  useEffect(() => {
    console.log("Received: ", webSocketHook.lastJsonMessage);
    if (
      webSocketHook.lastJsonMessage &&
      "action" in webSocketHook.lastJsonMessage &&
      webSocketHook.lastJsonMessage.action === "hello"
    ) {
      webSocketHook.sendJsonMessage({
        action: "hello",
        uid: id,
        partnerUid: getPartnerUID(),
      });
    }

    if (
      webSocketHook.lastJsonMessage &&
      "error" in webSocketHook.lastJsonMessage
    ) {
      toast.error(`Error: ${webSocketHook.lastJsonMessage.error}`);
    }
  }, [id, webSocketHook, webSocketHook.lastJsonMessage]);

  return (
    <html lang="en">
      <body className={customFont.className}>
        {webSocketHook.readyState !== ReadyState.OPEN ? (
          <>
            <main className="flex h-screen flex-col items-center justify-center">
              <span className="text-sm font-medium">
                {webSocketHook.readyState === ReadyState.CONNECTING
                  ? "Connecting..."
                  : "Connection Lost (try reloading the page)"}
              </span>
            </main>
          </>
        ) : (
          <QueryClientProvider client={queryClient}>
            <WebSocketContext.Provider
              value={{
                ...webSocketHook,
                sendJsonMessage: (msg: JsonValue, keep?: boolean) => {
                  console.log("Sending: ", msg);
                  webSocketHook.sendJsonMessage(msg, keep);
                },
              }}
            >
              <AutoRouting />
              {children}
              <Toaster position="bottom-center" />
            </WebSocketContext.Provider>
            <ReactQueryDevtools />
          </QueryClientProvider>
        )}
        <Link
          href="/"
          onClick={(e) => {
            e.preventDefault();
            resetUID();
            setPartnerUID(null);
            window.location.href = "/";
          }}
          className="absolute right-2 top-1 font-medium text-gray-500 underline"
        >
          Reset
        </Link>
      </body>
    </html>
  );
}
