"use client";

import { Interval } from "@/types/UserStats";
import { durationString, getInterruptions, sum } from "@/utils";
import {
  getPartnerUID,
  getUID,
  useAutoRerender,
  useStats,
} from "@/utils/react";
import { useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect, useMemo } from "react";
import { Spinner } from "../components/Spinner";
import { WebSocketContext } from "../layout";

const SESSION_DURATION = 45 * 60 * 1_000; // 45-minute session duration

export default function Page() {
  const id = getUID();
  const partnerId = getPartnerUID();
  const { data, isLoading } = useStats(id);

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2">
        <Spinner />
        <p>Loading statistics...</p>
      </div>
    );
  } else if (!data || !data.session_start) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2">
        <Spinner />
        <p>Waiting for data...</p>
      </div>
    );
  } else {
    return <StatsPage />;
  }
}

const StatsPage = () => {
  const id = getUID();
  const partnerId = getPartnerUID();
  const data = useStats(id).data!;
  const { data: partnerData } = useStats(partnerId);
  const client = useQueryClient();

  const { sendJsonMessage, lastJsonMessage } = useContext(WebSocketContext)!;

  useEffect(() => {
    // Refetch user data when partners switch or the session ends
    if (
      lastJsonMessage?.action === "switch" ||
      lastJsonMessage?.action === "end"
    ) {
      client.refetchQueries(["stats", id]);
      client.refetchQueries(["stats", partnerId]);
    }
  }, [lastJsonMessage, client, id, partnerId]);

  const utterances = sum(
    data.intervals,
    (interval) => interval.utterances.length
  );

  let driverMinutes = 0,
    navigatorMinutes = 0;

  for (let i = 0; i < data.intervals.length; i++) {
    const interval = data.intervals[i];
    const next =
      i === data.intervals.length - 1
        ? Date.now()
        : data.intervals[i + 1].start;

    const duration = next - interval.start;

    if (interval.status === "driver") {
      driverMinutes += duration / 1000 / 60;
    } else {
      navigatorMinutes += duration / 1000 / 60;
    }
  }

  if (!data.intervals || data.intervals.length === 0) {
    const duration = Date.now() - data.session_start;
    if (data.starting_status === "driver") {
      driverMinutes += duration / 1000 / 60;
    } else {
      navigatorMinutes += duration / 1000 / 60;
    }
  }

  const lastInterval: Interval | undefined =
    data.intervals?.[data.intervals?.length - 1];
  const partnerLastInterval: Interval | undefined =
    partnerData?.intervals?.[partnerData?.intervals.length - 1];

  const isDriver = lastInterval
    ? lastInterval.status === "navigator"
    : data.starting_status === "driver";

  const currentIntervalDuration =
    Date.now() - (lastInterval?.start ?? data.session_start);

  const timeSpent = Date.now() - data.session_start;
  const timeLeft = durationString(SESSION_DURATION - timeSpent);
  const timeTotal = durationString(SESSION_DURATION);

  // Get keystrokes and keystroke contribution between partners
  const keystrokes = data.intervals.length > 0 ? lastInterval!.keystrokes : 0;

  const keystrokeContribution = useMemo(() => {
    const partnerKeystrokes = partnerLastInterval?.keystrokes ?? 0;
    return keystrokes + partnerKeystrokes == 0
      ? "--%"
      : Math.round((keystrokes / (keystrokes + partnerKeystrokes)) * 100) + "%";
  }, [partnerLastInterval, keystrokes]);

  const interruptions = useMemo(
    () =>
      getInterruptions(
        lastInterval?.utterances,
        partnerLastInterval?.utterances
      ),
    [lastInterval, partnerLastInterval]
  );

  useAutoRerender();

  return (
    <>
      <main className="prose relative mx-auto flex max-w-lg flex-col gap-4 p-4 dark:prose-invert prose-headings:my-2">
        <div className="flex items-center justify-between">
          <div>
            <h1>You are {isDriver ? "Driver" : "Navigator"}</h1>
            <span className="text-sm">
              {Math.round(currentIntervalDuration / 1000 / 60)} minutes since
              last switch
            </span>
          </div>
        </div>
        {/* <p>
          {isDriver ? (
            <>
              As the driver, you&apos;re in charge of code editing. Delegate
              research and higher-level strategy to your navigator, or switch
              places and allow your partner to take over.
            </>
          ) : (
            <>
              As the navigator, you&apos;re in charge of research and
              higher-level strategy and problem-solving. Let your driver write
              code while you keep track of the big picture.
            </>
          )}
        </p> */}

        <div>
          <h2>Statistics</h2>
          <div className="grid grid-cols-2">
            <div>
              <h3>{keystrokes}</h3>
              <p>Total Keystrokes</p>
            </div>
            <div>
              <h3>{Math.round(driverMinutes)}</h3>
              <p>Minutes spent as driver</p>
            </div>
            <div>
              <h3>{utterances}</h3>
              <p>Utterances</p>
            </div>
            <div>
              <h3>{Math.round(navigatorMinutes)}</h3>
              <p>Minutes spent as navigator</p>
            </div>
            <div>
              <h3>{keystrokeContribution}</h3>
              <p>Total keystroke contribution</p>
            </div>
            <div>
              <h3>{interruptions}</h3>
              <p>Interruptions</p>
            </div>
          </div>
        </div>

        <div>
          <h2>Collaboration Tips</h2>
          {/* TODO: Write some collaboration tips and statistical conditions for each one */}
          <div className="opacity-25">
            <div>
              <p>
                ⏲️ <strong>Tip</strong>: You have written the majority of your
                team&apos;s project so far. Consider switching to navigator
                soon.
              </p>
            </div>

            <div>
              <p>
                🗣️ <strong>Tip</strong>: You haven&apos;t been speaking much
                recently. Make sure you communicate your ideas to your partner!
              </p>
            </div>

            <div>
              <p>
                😕 <strong>Tip</strong>: Your partner seems confused. Make sure
                you&apos;re clearly explaining your ideas to keep everyone on
                the same page.
              </p>
            </div>
          </div>
        </div>

        <hr />
        <h2>Debug Info</h2>

        <pre className="whitespace-pre-line">
          {JSON.stringify(data, null, 4)}
        </pre>

        <button
          className="rounded-md bg-blue-500 px-3 py-2 text-white"
          onClick={() => {
            sendJsonMessage({ action: "switch" });
          }}
        >
          Switch to {isDriver ? "Navigator" : "Driver"} &rarr;
        </button>

        {/* Extra space so that the user can see the content at the bottom,
       which would otherwise be covered by the fixed timer element */}
        <div className="h-32"></div>

        <div className="fixed inset-x-0 bottom-0 z-10">
          <div className="mx-auto flex h-20 items-center justify-between p-4 backdrop-blur-lg">
            <div>
              <span className="font-medium">
                Remaining time
                <br />
              </span>
              <span className="text-2xl">{timeLeft}</span>
              <span>/{timeTotal}</span>
            </div>
            <button
              className="flex h-10 items-center justify-center rounded-md bg-red-700 px-3 py-2 text-white"
              onClick={() => {
                // Disconnect websocket, render the final end stats page, and turn off speech and facial recognition */
                sendJsonMessage({ action: "end" });
              }}
            >
              End Session
            </button>
          </div>
        </div>
      </main>
    </>
  );
};
