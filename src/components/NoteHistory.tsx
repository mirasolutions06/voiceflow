"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
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
  "shrink-0 rounded-md px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide transition-colors";
const chipActive = "bg-ember/20 text-ember";
const chipIdle = "bg-bone/[0.05] text-bone/55";

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
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-bone/35" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes..."
            className="min-h-11 w-full rounded-lg border border-bone/10 bg-elevated py-2.5 pl-10 pr-4 text-[15px] text-bone placeholder-bone/40 outline-none focus:border-ember/40"
          />
        </div>

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
