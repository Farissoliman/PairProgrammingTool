type Status = "driver" | "navigator";

export type UserStats = {
  userId: string;
  partnerUid?: string;
  session_start: number;
  starting_status: Status;
  intervals: Interval[];
  session_end: number;
};

export type Interval = {
  status: Status;
  emotions: Emotion[];
  utterances: Utterance[];
  keystrokes: number;
  start: number;
};

export type Emotion = {
  emotion:
    | "angry"
    | "disgust"
    | "fear"
    | "happy"
    | "sad"
    | "surprise"
    | "neutral";
  timestamp: number;
};

export type Utterance = {
  start_time: number;
  utterance: string;
  end_time: number;
};
