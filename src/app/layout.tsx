"use client";

import { getPartnerUID, getUID, setPartnerUID } from "@/utils/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outfit } from "next/font/google";
import Link from "next/link";
import { createContext, useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { WebSocketHook } from "react-use-websocket/dist/lib/types";
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
  }, [webSocketHook.lastJsonMessage]);

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
            <WebSocketContext.Provider value={webSocketHook}>
              {children}
            </WebSocketContext.Provider>
            <ReactQueryDevtools />
          </QueryClientProvider>
        )}
        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPartnerUID(null);
            window.location.reload();
          }}
          className="absolute right-2 top-1 font-medium text-gray-500 underline"
        >
          Reset
        </Link>
      </body>
    </html>
  );
}
