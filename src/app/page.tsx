"use client";

import { getUID, useStats } from "@/utils/react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useContext } from "react";
import { WebSocketContext } from "./layout";

function Home() {
  const id = getUID();
  const router = useRouter();

  const { lastJsonMessage, sendJsonMessage, readyState } =
    useContext(WebSocketContext)!;

  const { data, isLoading } = useStats(id);

  if (isLoading) {
    return (
      <main className="flex h-screen flex-col items-center justify-center">
        <span className="text-sm font-medium">Loading...</span>
      </main>
    );
  }

  if (!data) {
    return <p>No data yet</p>;
  }

  router.push("/pair");

  return <>Working...</>;
}

const Page = dynamic(() => Promise.resolve(Home), {
  ssr: false,
});

export default Page;
