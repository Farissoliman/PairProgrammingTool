"use client";

import { PieChart } from "@/app/components/pieChart";
import { getInterruptions, sum } from "@/utils";
import {
  getPartnerUID,
  getUID,
  resetUID,
  setPartnerUID,
  useStats,
} from "@/utils/react";

import { Interval } from "@/types/UserStats";
import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/accordion";
import {
  default as driverMinutes,
  default as navigatorMinutes,
} from "../stats/page";

const getAllEmotions = (intervals: Interval[]) => {
  const count = { neutral: 0, positive: 0, negative: 0 };

  for (const interval of intervals) {
    for (const { emotion } of interval.emotions) {
      if (emotion === "fear" || emotion === "sad" || emotion === "angry") {
        count.negative++;
      } else if (emotion === "happy") {
        count.positive++;
      } else {
        count.neutral++;
      }
    }
  }

  return count;
};

export default function Page() {
  const id = getUID();
  const partnerId = getPartnerUID();
  const { data, isLoading } = useStats(id);
  const { data: partnerData } = useStats(partnerId);

  if (isLoading) {
    return <p>Loading...</p>;
  } else if (
    !data ||
    !data.session_end ||
    !partnerData ||
    !partnerData.session_end
  ) {
    return <p>No data yet!</p>;
  }

  const userUtterances = sum(
    data.intervals,
    (interval) => interval.utterances.length
  );
  const partnerUtterances = sum(
    partnerData.intervals,
    (interval) => interval.utterances.length
  );

  // Check if intervals array exists and has at least one element
  if (data.intervals.length === 0) {
    return <p>No intervals data yet!</p>;
  }

  const lastInterval = data.intervals?.[data.intervals?.length - 1];
  const lastPartnerInterval =
    partnerData.intervals?.[partnerData.intervals?.length - 1];

  const emotions = useMemo(() => {
    return getAllEmotions(data.intervals);
  }, [data.intervals]);

  const partnerEmotions = useMemo(() => {
    return getAllEmotions(partnerData.intervals);
  }, [partnerData.intervals]);

  const userInterruptions = useMemo(
    () =>
      getInterruptions(lastInterval.utterances, lastPartnerInterval.utterances),
    [lastInterval, lastPartnerInterval]
  );

  const partnerInterruptions = useMemo(
    () =>
      getInterruptions(lastPartnerInterval.utterances, lastInterval.utterances),
    [lastInterval, lastPartnerInterval]
  );

  const linesOfCode = lastInterval.keystrokes;
  const partnerLinesOfCode =
    partnerData.intervals[partnerData.intervals.length - 1].keystrokes;

  return (
    <>
      <main className="prose relative mx-auto flex max-w-lg flex-col gap-4 p-10 dark:prose-invert prose-headings:my-2">
        <div>
          <h2>🎉 Congratulations</h2>
          <p className="text-sm">
            Congratulations on finishing your pair programming session! Expand
            each section to learn more about your session.
          </p>
        </div>

        <Accordion
          type="single"
          collapsible
          defaultValue="item-0"
          className="w-full"
        >
          <AccordionItem value="item-0">
            <AccordionTrigger className="h-6">Session Summary</AccordionTrigger>
            <AccordionContent>
              <ul>
                <li className="text-sm">
                  You acted primarily as{" "}
                  <strong>
                    {driverMinutes > navigatorMinutes ? "Driver" : "Navigator"}
                  </strong>
                </li>
                <li className="text-sm">
                  {emotions && (
                    <>
                      Overall, you seemed{" "}
                      <strong>
                        {emotions!.negative >
                        emotions!.positive + emotions!.neutral
                          ? "Unhappy"
                          : "Happy"}
                      </strong>
                    </>
                  )}
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-1">
            <AccordionTrigger className="h-6">Keystrokes</AccordionTrigger>
            <AccordionContent>
              <p className="mt-0 text-sm text-gray-400">
                Percentage of the total keystrokes written by you and your
                partner
              </p>
              <PieChart
                data={[
                  { label: "You", value: linesOfCode },
                  { label: "Partner", value: partnerLinesOfCode },
                ]}
                width={150}
                height={150}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="h-6">
              Communication Style
            </AccordionTrigger>
            <AccordionContent>
              <p className="mt-0 text-sm text-gray-400">
                Number of utterances spoken by you (verbal) vs Number of facial
                expressions (non-verbal)
              </p>
              <div className="grid grid-cols-2">
                <h3>You</h3>
                <h3>Your Partner</h3>
                <PieChart
                  data={[
                    {
                      label: "Verbal",
                      value: sum(
                        data.intervals,
                        (interval) => interval.utterances.length
                      ),
                    },
                    {
                      label: "Non-Verbal",
                      value: sum(
                        data.intervals,
                        (interval) => interval.emotions.length
                      ),
                    },
                  ]}
                  width={150}
                  height={150}
                />
                <PieChart
                  data={[
                    {
                      label: "Verbal",
                      value: sum(
                        partnerData.intervals,
                        (interval) => interval.utterances.length
                      ),
                    },
                    {
                      label: "Non-Verbal",
                      value: sum(
                        partnerData.intervals,
                        (interval) => interval.emotions.length
                      ),
                    },
                  ]}
                  width={150}
                  height={150}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger className="h-6">
              Verbal Communication (Utterances)
            </AccordionTrigger>
            <AccordionContent>
              <p className="mt-0 text-sm text-gray-400">
                Lorem ipsum dolor sit, amet consectetur adipisicing elit. Vel
                quas atque ipsa vero qui quaerat amet, asperiores laudantium
                illum incidunt, velit possimus sed?
              </p>
              <PieChart
                data={[
                  { label: "You", value: userUtterances },
                  { label: "Your Partner", value: partnerUtterances },
                ]}
                width={150}
                height={150}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger className="h-6">Interruptions</AccordionTrigger>
            <AccordionContent>
              <p className="mt-0 text-sm text-gray-400">
                Number of times you interrupted your partner and the number of
                times they interrupted you.
              </p>
              <div className="flex justify-between">
                <ul>
                  <li>
                    <strong>You</strong>: {userInterruptions} interruptions
                  </li>
                  <li>
                    <strong>Your Partner</strong>: {userInterruptions}{" "}
                    interruptions
                  </li>
                </ul>

                <PieChart
                  data={[
                    { label: "You", value: userInterruptions },
                    { label: "Your Partner", value: partnerInterruptions },
                  ]}
                  width={150}
                  height={150}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger className="h-6">Emotions</AccordionTrigger>
            <AccordionContent>
              <p className="mt-0 text-sm text-gray-400">
                Lorem ipsum dolor sit, amet consectetur adipisicing elit. Vel
                quas atque ipsa vero qui quaerat amet, asperiores laudantium
                illum incidunt, velit possimus sed?
              </p>
              <div className="grid grid-cols-2">
                <h3>You</h3>
                <h3>Your Partner</h3>
                <PieChart
                  data={[
                    { label: "Positive", value: emotions.positive ?? 0 },
                    { label: "Neutral", value: emotions.neutral ?? 0 },
                    { label: "Negative", value: emotions.negative ?? 0 },
                  ]}
                  width={150}
                  height={150}
                />
                <PieChart
                  data={[
                    { label: "Positive", value: partnerEmotions.positive ?? 0 },
                    { label: "Neutral", value: partnerEmotions.neutral ?? 0 },
                    { label: "Negative", value: partnerEmotions.negative ?? 0 },
                  ]}
                  width={150}
                  height={150}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <button
          className="mt-12 rounded-md bg-blue-500 px-3 py-2 text-white"
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
