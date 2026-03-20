"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { slideUp } from "@/lib/animations";
import { useNotes } from "@/hooks/useNotes";
import type { TranscriptDraft } from "@/types";

interface TranscriptEditorProps {
  draft: TranscriptDraft;
  onClose: () => void;
  onSaved: () => void;
}

export function TranscriptEditor({ draft, onClose, onSaved }: TranscriptEditorProps) {
  const [title, setTitle] = useState(draft.title);
  const [transcript, setTranscript] = useState(draft.transcript);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(draft.tags);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const { mutate } = useNotes();

  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 400);
  }, []);

  const addTag = (value: string) => {
    const trimmed = value.trim().replace(/^#/, "");
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, transcript, tags, duration: draft.duration }),
      });

      if (!res.ok) throw new Error("Failed to save");

      setToast("Saved to Notion");
      await mutate();
      setTimeout(() => onSaved(), 1200);
    } catch {
      setToast("Failed to save — try again");
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        variants={slideUp}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-[28px] border-t border-white/[0.08] bg-[#1a1a1a] px-6 pb-10 pt-4"
      >
        {/* Drag handle */}
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-white/20" />

        {/* Title */}
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/30">
          Title
        </label>
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          className="mb-5 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-white/20 focus:ring-0"
        />

        {/* Transcript */}
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/30">
          Transcript
        </label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={6}
          className="mb-5 w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 font-mono text-xs leading-relaxed text-white/80 placeholder-white/25 outline-none focus:border-white/20"
        />

        {/* Tags */}
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/30">
          Tags
        </label>
        <div className="mb-6 flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 font-mono text-[11px] text-white/60"
            >
              #{tag}
              <button
                onClick={() => removeTag(tag)}
                className="text-white/30 hover:text-white/60"
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => tagInput && addTag(tagInput)}
            placeholder={tags.length === 0 ? "Add tags..." : ""}
            className="min-w-[80px] flex-1 bg-transparent font-mono text-xs text-white/60 placeholder-white/25 outline-none"
          />
        </div>

        {/* Actions */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="mb-3 w-full rounded-xl bg-white py-3.5 text-sm font-medium text-black transition-opacity disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save to Notion"}
        </button>
        <button
          onClick={onClose}
          className="w-full rounded-xl py-3 text-sm text-white/30 transition-colors hover:text-white/50"
        >
          Discard
        </button>
      </motion.div>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed left-1/2 top-6 z-[60] -translate-x-1/2 rounded-full border border-white/10 bg-[#1a1a1a] px-4 py-2 text-xs text-white/80 shadow-lg"
        >
          {toast}
        </motion.div>
      )}
    </>
  );
}
