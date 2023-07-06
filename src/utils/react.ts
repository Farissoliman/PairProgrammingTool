import { UserStats } from "@/types/UserStats";
import { createId } from "@paralleldrive/cuid2";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

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
  if (id === null) {
    return { data: null, isLoading: true };
  }
  return useQuery<UserStats>({
    queryKey: ["stats", id],
    queryFn: async () => await (await fetch(`/api/stats/${id}`)).json(),
  });
};

export const getUID = () => {
  let uid = localStorage.getItem("UID");
  if (!uid) {
    uid = createId();
    localStorage.setItem("UID", uid);
  }
  return uid;
};

export const getPartnerUID = () => {
  return localStorage.getItem("Partner_UID");
};

export const setPartnerUID = (uid: string | null) => {
  if (uid === null) {
    localStorage.removeItem("Partner_UID");
    return;
  }
  localStorage.setItem("Partner_UID", uid);
};
