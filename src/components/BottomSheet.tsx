"use client";

import { useState } from "react";
import { motion, type PanInfo } from "framer-motion";
import { ChevronUp } from "lucide-react";
import { NoteHistory } from "./NoteHistory";
import { LocalDraftQueue } from "./LocalDraftQueue";
import { useNotes } from "@/hooks/useNotes";
import { useLocalDrafts } from "@/hooks/useLocalDrafts";

export function BottomSheet() {
  const [expanded, setExpanded] = useState(false);
  const { notes } = useNotes();
  const { drafts } = useLocalDrafts();

  const draftCount = drafts.filter((d) => d.status !== "syncing").length;
  const noteCount = notes.length;

  const handlePanEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y < -40) setExpanded(true);
    else if (info.offset.y > 40) setExpanded(false);
  };

  return (
    <>
      {/* Backdrop — dims the recorder when the sheet is open */}
      <div
        onClick={() => setExpanded(false)}
        className={`fixed inset-0 z-30 bg-base/70 transition-opacity duration-[450ms] ${
          expanded ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Sheet */}
      <section
        className={`fixed inset-x-0 bottom-0 z-40 flex h-[86dvh] flex-col rounded-t-[28px] border-t border-bone/10 bg-surface transition-transform duration-[450ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
          expanded ? "translate-y-0" : "translate-y-[calc(100%_-_72px)]"
        }`}
      >
        {/* Peek header — tap or drag to toggle */}
        <motion.div
          onPanEnd={handlePanEnd}
          onClick={() => setExpanded((e) => !e)}
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse notes" : "Expand notes"}
          className="flex h-[72px] shrink-0 cursor-grab touch-none select-none flex-col justify-center px-5 outline-none active:cursor-grabbing"
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-bone/20" />
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="kicker text-bone/50">Recent</span>
              <span className="font-mono text-[11px] text-bone/30">{noteCount}</span>
              {draftCount > 0 && (
                <span className="rounded-full bg-ember/12 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ember">
                  {draftCount} draft{draftCount === 1 ? "" : "s"}
                </span>
              )}
            </div>
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
              className="text-bone/40"
            >
              <ChevronUp className="h-5 w-5" />
            </motion.span>
          </div>
        </motion.div>

        {/* Scrollable content */}
        <div className="sheet-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)_+_28px)]">
          <LocalDraftQueue />
          <NoteHistory />
        </div>
      </section>
    </>
  );
}
