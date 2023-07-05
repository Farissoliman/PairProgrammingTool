import { getDatabase } from "@/utils/mongo";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export const collection = async () => (await getDatabase()).collection("stats");

export const GET = async (
  request: Request,
  { params: { uid } }: { params: { uid: string } }
) => {
  const doc = await (
    await collection()
  ).findOne({
    _id: {
      $eq: uid as unknown as ObjectId,
    },
  });

  return NextResponse.json(doc);
};
