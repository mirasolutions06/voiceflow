"use client";

import useSWR from "swr";
import type { Note } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useNotes() {
  const { data, error, isLoading, mutate } = useSWR<{ notes: Note[] }>(
    "/api/notion",
    fetcher,
    { refreshInterval: 30000 } // re-poll every 30s to pick up MiraFlow status updates
  );

  return {
    notes: data?.notes ?? [],
    isLoading,
    error,
    mutate,
  };
}
