"use client";

import { sum } from "@/utils";
import { getUID, getPartnerUID, useStats, resetUID, setPartnerUID } from "@/utils/react";
import { PieChart } from "@/app/components/pieChart";

import driverMinutes from "../stats/page";
import navigatorMinutes from "../stats/page";


export default function Page() {
  const id = getUID();
  const partnerId = getPartnerUID();
  const { data, isLoading } = useStats(id);
  const { data: partnerData } = useStats(partnerId);

  if (isLoading) {
    return <p>Loading...</p>;
  } else if (!data || !data.session_end || !partnerData || !partnerData.session_end) {
    return <p>No data yet!</p>;
  }

  const userUtterances = sum(data.intervals, (interval) => interval.utterances.length);
  const partnerUtterances = sum(partnerData.intervals, (interval) => interval.utterances.length);

  let negativeEmotionCounter = 0;
  let positiveEmotionCounter = 0;
  let neutralEmotionCounter = 0;

  // Check if intervals array exists and has at least one element
  if (data.intervals.length === 0) {
    return <p>No intervals data yet!</p>;
  }
  
  const lastInterval = data.intervals[data.intervals.length - 1];
  for (let i = 0; i < lastInterval.emotions.length; i++) {
    const emotion = data.intervals[data.intervals.length - 1].emotions[i];
    if (emotion.emotion === "fear" || emotion.emotion === "sad" || emotion.emotion === "anger"
        || emotion.emotion === "disgust") {
          negativeEmotionCounter++;
        }
    else if (emotion.emotion === "happy") {
      positiveEmotionCounter++;
    }
    else {
      neutralEmotionCounter++;
    }
  }

  const nonVerbalExpressions = lastInterval.emotions.length;

  // const linesOfCode = lastInterval.keystrokes;
  // const partnerLinesOfCode = partnerData.intervals[partnerData.intervals.length - 1].keystrokes;
  const linesOfCode = 1;
  const partnerLinesOfCode = 1;

  return (
    <>
      <main className="prose relative mx-auto flex max-w-lg flex-col gap-4 p-10 dark:prose-invert prose-headings:my-2">
        <div>
          <h2>Congratulations</h2>
          <p className="text-sm">
            Congratulations on finishing your pair programming session!
          </p>
          <hr className="m-0"/>
        </div>
        <div>
          <h3>Session Summary</h3>
          <div></div>
          <ul className="mb-4">
            <li className="text-sm">
              You acted primarily as <strong>{driverMinutes > navigatorMinutes ? "Driver" : "Navigator"}</strong>
            </li>
            <li className="text-sm"> 
              Overall, you seemed <strong>{
                negativeEmotionCounter > (positiveEmotionCounter + neutralEmotionCounter) ? "Unhappy" : "Happy"
                }</strong>
            </li>
          </ul>
          <div className="flex pt-4 mb-8 space-x-10">
            <div className="flex-1 text-xl m-auto">
              <p className="mb-0">
                Keystrokes
              </p>
              <p className="text-xs mt-3 opacity-60">
                Percentage of the total keystrokes written by you and your partner
              </p>
            </div>
            <PieChart 
              data={[{ label : "You", value : linesOfCode }, { label : "Partner", value : partnerLinesOfCode }]} 
              width={80}
              height={80}
            />
          </div>
          <div className="flex pt-4 mb-8 space-x-10">
            <div className="flex-1 text-xl m-auto">
              <p className="mb-0">
                Communication Style
              </p>
              <p className="text-xs mt-3 opacity-60">
                Number of utterances spoken by you (verbal) vs 
                Number of facial expressions (non-verbal)
              </p>
            </div>
            <PieChart 
              data={[{ label : "Verbal", value : userUtterances }, { label : "Non-Verbal", value : nonVerbalExpressions }]}
              width={80}
              height={80}
            />
          </div>
          <div className="flex pt-4 mb-8 space-x-10">
            <div className="flex-1 text-xl m-auto">
              <p className="mb-0">
                Interruptions
              </p>
              <p className="text-xs mt-3 opacity-60">
                Number of times you interrupted your partner and the number of times they interrupted you.
              </p>
            </div>
            <PieChart 
              data={[{ label : "You", value : data.interruptions }, { label : "Partner", value : partnerData.interruptions }]}
              width={150}
              height={150}
            />
            <div className="flex-2">Pie Chart Goes Here</div>
          </div>
          <div className="flex pt-4 mb-8 space-x-10">
            <div className="flex-1 text-xl m-auto">
              <p className="mb-0">
                Your Emotions
              </p>
              <p className="text-xs mt-3 opacity-60">
                Were the number of total lines of code written by you and your partner equal?
              </p>
            </div>
            {/* <PieChart 
              data={[{ label : "You", value : linesOfCode }, { label : "Partner", value : partnerLinesOfCode }]} 
              width={150}
              height={150}
            /> */}
            <div className="flex-2">Pie Chart Goes Here</div>
          </div>
        </div>
        <button
          className="rounded-md bg-blue-500 px-3 py-2 text-white mt-12"
          onClick={(e) => {
            e.preventDefault();
            resetUID();
            setPartnerUID(null);
            window.location.href = "/";
          }}
        >
          Start a new session
        </button>
      </main>
    </>
  );
}