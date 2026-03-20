"use client";

import { motion } from "framer-motion";
import { NoteCard } from "./NoteCard";
import { stagger, fadeInUp } from "@/lib/animations";
import { useNotes } from "@/hooks/useNotes";

export function NoteHistory() {
  const { notes, isLoading, error } = useNotes();

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
      <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-white/30">
        Recent Notes
      </p>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {notes.map((note) => (
          <motion.div key={note.id} variants={fadeInUp}>
            <NoteCard note={note} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
