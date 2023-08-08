type Status = "driver" | "navigator";

export type UserStats = {
  _id: string;
  session_start: number;
  starting_status: Status;
  interruptions: number;
  intervals: {
    status: Status;
    emotions: {
        emotion: string;
        timestamp: number;
    }[];
    utterances: {
        start_time: number;
        utterance: string;
        end_time: number;
    }[];
    keystrokes: number;
    start: number;
  }[];
  session_end: number;
};
