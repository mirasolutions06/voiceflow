"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Save, Trash2, Archive } from "lucide-react";
import { slideUp } from "@/lib/animations";
import { useNotes } from "@/hooks/useNotes";
import { deleteLocalDraft, getLocalDraft, updateLocalDraft } from "@/lib/localDrafts";
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
  const [transcriptOpen, setTranscriptOpen] = useState(!draft.processed?.summary);
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
    if (draft.localDraftId) {
      await updateLocalDraft(draft.localDraftId, { status: "syncing", error: null });
    }

    try {
      const res = await fetch("/api/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          transcript,
          tags,
          duration: draft.duration,
          recordedAt: draft.recordedAt,
          processed: draft.processed,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      if (draft.localDraftId) {
        await deleteLocalDraft(draft.localDraftId);
      }
      setToast("Saved to Notion");
      await mutate();
      setTimeout(() => onSaved(), 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      if (draft.localDraftId) {
        await updateLocalDraft(draft.localDraftId, {
          status: "ready",
          error: `${message}. Local draft kept.`,
        });
      }
      setToast("Failed to save. Local draft kept.");
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleKeepDraft = async () => {
    if (draft.localDraftId) {
      await updateLocalDraft(draft.localDraftId, {
        title,
        transcript,
        tags,
        status: "ready",
        error: null,
      });
      setToast("Draft kept");
      setTimeout(onClose, 700);
      return;
    }

    onClose();
  };

  const handleDownloadAudio = async () => {
    if (!draft.localDraftId) return;
    const localDraft = await getLocalDraft(draft.localDraftId);
    if (!localDraft) return;

    const url = URL.createObjectURL(localDraft.audioBlob);
    const a = document.createElement("a");
    const ext = localDraft.audioType.includes("mp4")
      ? "mp4"
      : localDraft.audioType.includes("ogg")
        ? "ogg"
        : "webm";
    a.href = url;
    a.download = `voiceflow-${localDraft.recordedAt.slice(0, 19).replace(/[:T]/g, "-")}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDeleteDraft = async () => {
    if (draft.localDraftId) {
      await deleteLocalDraft(draft.localDraftId);
    }
    onClose();
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
        className="fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-[28px] border-t border-white/[0.08] bg-[#0a0a0a] px-6 pb-10 pt-4"
      >
        {/* Drag handle */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/25">
              Review
            </p>
            <p className="mt-1 text-sm text-white/55">
              {draft.localDraftId ? "Local draft" : "Transcript"}
            </p>
          </div>
          <span className="rounded-full border border-green-300/20 bg-green-300/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-green-100/60">
            Ready
          </span>
        </div>

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

        {draft.processed?.summary && (
          <div className="mb-5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-white/30">
              Summary
            </p>
            <p className="text-xs leading-relaxed text-white/60">
              {draft.processed.summary}
            </p>
            {draft.processed.actionItems.length > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-white/30">
                  Actions
                </p>
                <ul className="space-y-1 text-xs leading-relaxed text-white/55">
                  {draft.processed.actionItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {draft.processed.decisions.length > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-white/30">
                  Decisions
                </p>
                <ul className="space-y-1 text-xs leading-relaxed text-white/55">
                  {draft.processed.decisions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {draft.processed.followUps.length > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-white/30">
                  Follow-ups
                </p>
                <ul className="space-y-1 text-xs leading-relaxed text-white/55">
                  {draft.processed.followUps.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

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

        <div className="mb-6 rounded-xl border border-white/[0.08] bg-white/[0.03]">
          <button
            onClick={() => setTranscriptOpen((open) => !open)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-[11px] font-medium uppercase tracking-wider text-white/30">
              Full Transcript
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/30">
              {transcriptOpen ? "Hide" : "Edit"}
            </span>
          </button>
          {transcriptOpen && (
            <div className="border-t border-white/[0.06] p-3">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={8}
                className="w-full resize-none rounded-lg border border-white/[0.08] bg-black/20 px-3 py-3 font-mono text-xs leading-relaxed text-white/80 placeholder-white/25 outline-none focus:border-white/20"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="mb-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-medium text-black transition-opacity disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save to Notion"}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleKeepDraft}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm text-white/45 transition-colors hover:text-white/70"
          >
            <Archive className="h-4 w-4" />
            Keep Draft
          </button>
          <button
            onClick={handleDownloadAudio}
            disabled={!draft.localDraftId}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm text-white/45 transition-colors hover:text-white/70 disabled:opacity-30"
          >
            <Download className="h-4 w-4" />
            Download Audio
          </button>
        </div>
        {draft.localDraftId && (
          <button
            onClick={handleDeleteDraft}
            className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl py-3 text-sm text-white/28 transition-colors hover:text-white/50"
          >
            <Trash2 className="h-4 w-4" />
            Delete Draft
          </button>
        )}
      </motion.div>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed left-1/2 top-6 z-[60] -translate-x-1/2 rounded-full border border-white/10 bg-[#0a0a0a] px-4 py-2 text-xs text-white/80 shadow-lg"
        >
          {toast}
        </motion.div>
      )}
    </>
  );
}
