"use client";

import type { NoteStatus } from "@/types";

const styles: Record<NoteStatus, string> = {
  New: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Processing: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Done: "bg-green-500/20 text-green-300 border-green-500/30",
  Archived: "bg-white/10 text-white/40 border-white/10",
};

export function StatusBadge({ status }: { status: NoteStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] leading-none ${styles[status]}`}
    >
      {status}
    </span>
  );
}
