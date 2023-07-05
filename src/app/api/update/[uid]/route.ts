import { ObjectId } from "mongodb";
import { z } from "zod";
import { collection } from "../../stats/[uid]/route";

const schema = z.object({
  status: z.string().refine((it) => {
    if (it !== "driver" && it !== "navigator") {
      throw new Error("invalid status: must be 'driver' or 'navigator'");
    }
  }),
  start: z.number(),
  lines_written: z.number(),
  utterances: z.array(z.number()),
});

export const POST = async (
  request: Request,
  { params: { uid } }: { params: { uid: string } }
) => {
  const body = schema.parse(await request.json());

  (await collection()).updateOne(
    {
      _id: {
        $eq: uid as unknown as ObjectId,
      },
    },
    {
      intervals: {
        $push: body,
      },
    }
  );
};
