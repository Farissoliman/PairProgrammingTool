import { generate } from "generate-passphrase";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = () => {
  return new NextResponse(generate({ length: 3, numbers: false }));
};
