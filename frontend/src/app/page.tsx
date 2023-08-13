"use client";

import { getUID } from "@/utils/react";
import dynamic from "next/dynamic";
import { Spinner } from "./components/Spinner";

function Home() {
  const id = getUID();

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-2">
      <Spinner />
      Starting up...
    </main>
  );
}

const Page = dynamic(() => Promise.resolve(Home), {
  ssr: false,
});

export default Page;
