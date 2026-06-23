"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "@/lib/utils";
import type { Note } from "@/types";

export function NoteCard({ note }: { note: Note }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      onClick={() => setExpanded((e) => !e)}
      className="cursor-pointer rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5 transition-colors hover:bg-white/[0.06]"
    >
      <div className="flex items-start justify-between gap-2">
        <StatusBadge status={note.status} />
        <span className="font-mono text-[11px] text-white/35" suppressHydrationWarning>
          {formatDate(note.recordedAt)}
        </span>
      </div>

      <p className="mt-2 text-sm font-medium leading-snug text-white">
        {note.title}
      </p>

      {note.transcript && (
        <p className="mt-1.5 line-clamp-2 font-mono text-xs leading-relaxed text-white/35">
          {note.transcript}
        </p>
      )}

      {note.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/[0.12] px-2 py-0.5 font-mono text-[10px] text-white/35"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 border-t border-white/[0.08] pt-4">
              {note.transcript && (
                <p className="font-mono text-xs leading-relaxed text-white/50">
                  {note.transcript}
                </p>
              )}
              {note.miraOutput && (
                <div className="mt-3">
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-white/30">
                    Mira
                  </p>
                  <p className="text-xs leading-relaxed text-white/60">
                    {note.miraOutput}
                  </p>
                </div>
              )}
              {note.actionItems && (
                <div className="mt-3">
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-white/30">
                    Action items
                  </p>
                  <p className="text-xs leading-relaxed text-white/60">
                    {note.actionItems}
                  </p>
                </div>
              )}
              {note.notionUrl && (
                <a
                  href={note.notionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] text-white/40 underline underline-offset-2 hover:text-white/60"
                >
                  Open in Notion →
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
