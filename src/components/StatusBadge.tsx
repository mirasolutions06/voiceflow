"use client";

import type { NoteStatus } from "@/types";

const styles: Record<NoteStatus, string> = {
  New: "bg-ember/12 text-ember border-ember/25",
  Processing: "bg-ember/12 text-ember border-ember/25",
  Processed: "bg-sage/12 text-sage border-sage/25",
  Done: "bg-sage/12 text-sage border-sage/25",
  Archived: "bg-bone/[0.06] text-bone/40 border-bone/10",
};

export function StatusBadge({ status }: { status: NoteStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase leading-none tracking-wider ${styles[status]}`}
    >
      {status}
    </span>
  );
}
