"use client";

import { useCallback, useEffect, useState } from "react";
import { listLocalDrafts, LOCAL_DRAFTS_CHANGED } from "@/lib/localDrafts";
import type { LocalDraft } from "@/types";

export function useLocalDrafts() {
  const [drafts, setDrafts] = useState<LocalDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setDrafts(await listLocalDrafts());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    window.addEventListener(LOCAL_DRAFTS_CHANGED, refresh);
    return () => window.removeEventListener(LOCAL_DRAFTS_CHANGED, refresh);
  }, [refresh]);

  return { drafts, isLoading, refresh };
}
