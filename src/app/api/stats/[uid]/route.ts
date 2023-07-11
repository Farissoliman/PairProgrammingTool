import { getDatabase } from "@/utils/mongo.mjs";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export const GET = async (
  request: Request,
  { params: { uid } }: { params: { uid: string } }
) => {
  const doc = await (await getDatabase()).collection("stats").findOne({
    _id: {
      $eq: uid as unknown as ObjectId,
    },
  });

  return NextResponse.json(doc);
};
