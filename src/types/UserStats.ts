export type UserStats = {
  _id: string;
  session_start: number;
  intervals: {
    status: "driver" | "navigator";
    utterances: number[];
    lines_written: number;
    start: number;
  }[];
};
