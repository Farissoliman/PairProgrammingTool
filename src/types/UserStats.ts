type Status = "driver" | "navigator";

export type UserStats = {
  _id: string;
  session_start: number;
  starting_status: Status;
  intervals: {
    status: Status;
    utterances: {
        start_time: number;
        utterance: string;
        end_time: number;
    }[];
    keystrokes: number;
    start: number;
  }[];
};
