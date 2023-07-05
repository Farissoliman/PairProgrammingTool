import { UserStats } from "@/types/UserStats";
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

export const useStats = (id: string) => {
  return useQuery<UserStats>({
    queryKey: ["stats", id],
    queryFn: async () => await (await fetch(`/api/stats/${id}`)).json(),
  });
};
