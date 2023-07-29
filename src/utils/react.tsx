import { WebSocketContext } from "@/app/layout";
import { UserStats } from "@/types/UserStats";
import { createId } from "@paralleldrive/cuid2";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useContext, useEffect, useState } from "react";

/**
 * Forces a component to re-render every `period` milliseconds.
 */
export const useAutoRerender = (period: number = 1000) => {
  const [state, setState] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setState((state) => state + 1), period);
    return () => clearInterval(interval);
  });
};

export const useStats = (id: string | null) => {
  return useQuery<UserStats>({
    enabled: typeof window !== "undefined",
    queryKey: ["stats", id],
    queryFn: async () => await (await fetch(`/api/stats/${id}`)).json(),
  });
};

export const getUID = () => {
  if (typeof window === "undefined") {
    return null;
  }
  let uid = localStorage.getItem("UID");
  if (!uid) {
    uid = createId();
    localStorage.setItem("UID", uid);
  }
  return uid;
};

export const resetUID = () => {
  localStorage.removeItem("UID");
};

let partnerUid: string | null = null;

export const getPartnerUID = () => {
  return partnerUid;
};

export const setPartnerUID = (uid: string | null) => {
  partnerUid = uid;

  // If this page is in an iframe,
  // give the parent (VSCode extension) both IDs
  window.parent?.postMessage(
    {
      message: "id",
      uid: getUID(),
      partnerUid: uid,
    },
    "*"
  );
};

export const useRouting = () => {
  const uid = getUID();

  const queryClient = useQueryClient();

  const { data, isLoading } = useStats(uid);

  const { lastJsonMessage } = useContext(WebSocketContext)!;

  const router = useRouter();
  const pathname = usePathname();

  const [state, setState] = useState(0);
  useEffect(() => {
    const interval = setInterval(
      () => setState((current) => current + 1),
      2000 // Force the effect to run at least once every 2 seconds
    );
    return () => clearInterval(interval);
  }, []);

  const goto = useCallback(
    (path: string) => {
      if (pathname !== path) {
        console.log("Redirecting to ", path);
        router.push(path);
      }
    },
    [pathname]
  );

  useEffect(() => {
    if (lastJsonMessage?.action === "id") {
      if (lastJsonMessage.uid && lastJsonMessage.partnerUid) {
        setPartnerUID(lastJsonMessage.partnerUid);
      }
    } else if (lastJsonMessage?.action === "start") {
      queryClient.invalidateQueries(["stats", uid]);
    }
  }, [lastJsonMessage, queryClient]);

  useEffect(() => {
    const partnerUid = getPartnerUID();

    if (isLoading) {
      // Wait for data to finish loading before deciding which page to route to
      return;
    }

    if (data?.session_end) {
      goto("/end");
    } else if (data?.session_start) {
      goto("/stats");
    } else if (uid && partnerUid) {
        goto("/start");
    } else {
        goto("/pair");
    }
  }, [data, isLoading, uid, state, goto]);
};

export const AutoRouting = () => {
  useRouting();

  return <></>;
};
