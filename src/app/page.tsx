"use client";

import { getUID } from "@/utils/react";
import dynamic from "next/dynamic";

function Home() {
  const id = getUID();

  return (
    <main className="flex h-screen flex-col items-center justify-center">
      <span className="text-sm font-medium">Loading...</span>
    </main>
  );
}

const Page = dynamic(() => Promise.resolve(Home), {
  ssr: false,
});

export default Page;
