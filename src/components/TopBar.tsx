"use client";

import { useLocalDrafts } from "@/hooks/useLocalDrafts";

function statusLabel(count: number, failed: number, syncing: number) {
  if (syncing > 0) return "Syncing";
  if (failed > 0) return `${failed} to fix`;
  if (count > 0) return `${count} ${count === 1 ? "draft" : "drafts"}`;
  return "All saved";
}

export function TopBar() {
  const { drafts, isLoading } = useLocalDrafts();
  const failed = drafts.filter((draft) => draft.status === "failed").length;
  const syncing = drafts.filter((draft) => draft.status === "syncing").length;
  const count = drafts.length;

  const dotClass =
    failed > 0 ? "bg-clay" : syncing > 0 ? "bg-ember" : "bg-sage";

  return (
    <header className="flex shrink-0 items-center justify-between px-6 pt-[calc(env(safe-area-inset-top)_+_18px)]">
      <p className="text-[15px] font-medium tracking-tight text-bone">
        voiceflow<span className="text-ember">.</span>
      </p>
      <div className="inline-flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-bone/35">
          {isLoading ? "Checking" : statusLabel(count, failed, syncing)}
        </span>
      </div>
    </header>
  );
}
