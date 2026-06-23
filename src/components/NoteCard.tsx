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
      className="cursor-pointer border-b border-bone/[0.08] py-4 transition-colors active:bg-bone/[0.02]"
    >
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={note.status} />
        <span className="font-mono text-[11px] text-bone/45" suppressHydrationWarning>
          {formatDate(note.recordedAt)}
        </span>
      </div>

      <p className="mt-2.5 text-[15px] font-medium leading-snug text-bone">
        {note.title}
      </p>

      {note.transcript && (
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-bone/55">
          {note.transcript}
        </p>
      )}

      {note.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-bone/[0.06] px-2 py-0.5 font-mono text-[10px] text-bone/55"
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
            <div className="mt-4 border-t border-bone/[0.08] pt-4">
              {note.transcript && (
                <p className="text-[13px] leading-relaxed text-bone/70">
                  {note.transcript}
                </p>
              )}
              {note.miraOutput && (
                <div className="mt-4">
                  <p className="kicker mb-1.5 text-ember/70">Mira</p>
                  <p className="text-[13px] leading-relaxed text-bone/75">
                    {note.miraOutput}
                  </p>
                </div>
              )}
              {note.actionItems && (
                <div className="mt-4">
                  <p className="kicker mb-1.5 text-ember/70">Action items</p>
                  <p className="text-[13px] leading-relaxed text-bone/75">
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
                  className="mt-4 inline-flex items-center gap-1 font-mono text-[12px] text-ember underline underline-offset-2"
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
