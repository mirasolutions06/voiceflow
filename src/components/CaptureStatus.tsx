"use client";

import { useLocalDrafts } from "@/hooks/useLocalDrafts";

function labelFor(count: number, failed: number, syncing: number) {
  if (syncing > 0) return "Syncing to Notion";
  if (failed > 0) return `${failed} needs attention`;
  if (count > 0) return `${count} local ${count === 1 ? "draft" : "drafts"}`;
  return "All recordings saved locally";
}

export function CaptureStatus() {
  const { drafts, isLoading } = useLocalDrafts();
  const failed = drafts.filter((draft) => draft.status === "failed").length;
  const syncing = drafts.filter((draft) => draft.status === "syncing").length;
  const count = drafts.length;

  return (
    <div className="mx-auto mt-6 flex w-full max-w-sm items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          failed > 0 ? "bg-red-300/70" : syncing > 0 ? "bg-amber-300/70" : "bg-green-300/60"
        }`}
      />
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/35">
        {isLoading ? "Checking drafts" : labelFor(count, failed, syncing)}
      </span>
    </div>
  );
}
