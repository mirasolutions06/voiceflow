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

const chipBase =
  "shrink-0 rounded-md border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors";
const chipActive = "border-ember/40 bg-ember/12 text-ember";
const chipIdle = "border-bone/10 bg-bone/[0.03] text-bone/50";

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
      <div className="mt-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-bone/[0.04]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="mt-8 text-center font-mono text-xs text-bone/45">
        Could not load notes
      </p>
    );
  }

  if (notes.length === 0) {
    return (
      <p className="mt-8 text-center font-mono text-xs text-bone/40">
        No notes yet — record your first
      </p>
    );
  }

  return (
    <div className="mt-1">
      <div className="mb-4 space-y-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes..."
          className="min-h-11 w-full rounded-lg border border-bone/10 bg-elevated px-4 py-2.5 text-[15px] text-bone placeholder-bone/35 outline-none focus:border-ember/40"
        />

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {statusOptions.map((option) => (
            <button
              key={option}
              onClick={() => setStatus(option)}
              className={`${chipBase} ${status === option ? chipActive : chipIdle}`}
            >
              {option}
            </button>
          ))}
        </div>

        {tags.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setTag("All")}
              className={`${chipBase} ${tag === "All" ? chipActive : chipIdle}`}
            >
              All tags
            </button>
            {tags.map((item) => (
              <button
                key={item}
                onClick={() => setTag(item)}
                className={`${chipBase} ${tag === item ? chipActive : chipIdle}`}
              >
                #{item}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredNotes.length === 0 && (
        <p className="mt-8 text-center font-mono text-xs text-bone/40">
          No matching notes
        </p>
      )}

      <motion.div variants={stagger} initial="hidden" animate="visible">
        {filteredNotes.map((note) => (
          <motion.div key={note.id} variants={fadeInUp}>
            <NoteCard note={note} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
