"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { NoteCard } from "./NoteCard";
import { stagger, fadeInUp } from "@/lib/animations";
import { useNotes } from "@/hooks/useNotes";
import type { NoteStatus } from "@/types";

const statusOptions: Array<"All" | NoteStatus> = [
  "All",
  "New",
  "Processing",
  "Processed",
  "Done",
  "Archived",
];

export function NoteHistory() {
  const { notes, isLoading, error } = useNotes();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | NoteStatus>("All");
  const [tag, setTag] = useState("All");

  const tags = useMemo(() => {
    return Array.from(new Set(notes.flatMap((note) => note.tags))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((note) => {
      const matchesQuery =
        !q ||
        [
          note.title,
          note.transcript,
          note.miraOutput ?? "",
          note.actionItems ?? "",
          ...note.tags,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesStatus = status === "All" || note.status === status;
      const matchesTag = tag === "All" || note.tags.includes(tag);
      return matchesQuery && matchesStatus && matchesTag;
    });
  }, [notes, query, status, tag]);

  if (isLoading) {
    return (
      <div className="mt-8 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-[20px] bg-white/[0.04]"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="mt-8 text-center font-mono text-xs text-white/30">
        Could not load notes
      </p>
    );
  }

  if (notes.length === 0) {
    return (
      <p className="mt-8 text-center font-mono text-xs text-white/25">
        No notes yet — record your first
      </p>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/30">
            Recent Notes
          </p>
          <span className="font-mono text-[10px] text-white/25">
            {filteredNotes.length}/{notes.length}
          </span>
        </div>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes..."
          className="min-h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-base text-white placeholder-white/25 outline-none focus:border-white/20"
        />

        <div className="flex gap-2 overflow-x-auto pb-1">
            {statusOptions.map((option) => (
            <button
              key={option}
              onClick={() => setStatus(option)}
              className={`min-h-11 min-w-11 shrink-0 rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-wider ${
                status === option
                  ? "border-white/20 bg-white/12 text-white/75"
                  : "border-white/[0.08] bg-white/[0.03] text-white/32"
              }`}
            >
                {option}
            </button>
            ))}
        </div>

        {tags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setTag("All")}
              className={`min-h-11 min-w-11 shrink-0 rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-wider ${
                tag === "All"
                  ? "border-white/20 bg-white/12 text-white/75"
                  : "border-white/[0.08] bg-white/[0.03] text-white/32"
              }`}
            >
              All tags
            </button>
            {tags.map((item) => (
              <button
                key={item}
                onClick={() => setTag(item)}
                className={`min-h-11 min-w-11 shrink-0 rounded-full border px-4 py-2 font-mono text-[10px] ${
                  tag === item
                    ? "border-white/20 bg-white/12 text-white/75"
                    : "border-white/[0.08] bg-white/[0.03] text-white/32"
                }`}
              >
                #{item}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredNotes.length === 0 && (
        <p className="mt-8 text-center font-mono text-xs text-white/25">
          No matching notes
        </p>
      )}

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {filteredNotes.map((note) => (
          <motion.div key={note.id} variants={fadeInUp}>
            <NoteCard note={note} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
