"use client";

import { AutoRouting, getUID, resetUID, setPartnerUID } from "@/utils/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outfit } from "next/font/google";
import Link from "next/link";
import { createContext, useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { JsonValue, WebSocketHook } from "react-use-websocket/dist/lib/types";
import { Spinner } from "./components/Spinner";
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

  const webSocketHook = useWebSocket(
    process.env.WS_SERVER_ADDRESS ?? `ws://lin-res128.csc.ncsu.edu:3030`,
    {
      shouldReconnect: () => true,
      reconnectInterval: () => 500,
    }
  );

  useEffect(() => {
    console.log("Received: ", webSocketHook.lastJsonMessage);

    if (webSocketHook.lastJsonMessage) {
      if ("error" in webSocketHook.lastJsonMessage) {
        toast.error(`Error: ${webSocketHook.lastJsonMessage.error}`);
      } else if ("action" in webSocketHook.lastJsonMessage) {
        if (webSocketHook.lastJsonMessage.action === "toast") {
          toast(webSocketHook.lastJsonMessage.message?.toString() ?? null);
        }
      }
    }
  }, [id, webSocketHook, webSocketHook.lastJsonMessage]);

  return (
    <html lang="en" className="dark">
      <body
        className={`${customFont.className} dark:bg-[#181818] dark:text-white`}
      >
        {webSocketHook.readyState !== ReadyState.OPEN ? (
          <>
            <main className="flex h-screen flex-col items-center justify-center">
              {webSocketHook.readyState === ReadyState.CONNECTING ? (
                <div className="flex flex-col items-center justify-center gap-4">
                  <Spinner />
                  <p className="text-center">Connecting...</p>
                </div>
              ) : (
                <span className="font-medium">
                  Connection Lost (try reloading the page)
                </span>
              )}
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
            {window === window.parent && (
              // Disable react query devtools when loaded inside an iframe
              <ReactQueryDevtools />
            )}
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
          className="absolute right-2 top-1 font-medium text-gray-500 underline dark:text-gray-300"
        >
          Reset
        </Link>
      </body>
    </html>
  );
}
