"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FilePenLine, RotateCcw, Trash2 } from "lucide-react";
import { deleteLocalDraft, updateLocalDraft } from "@/lib/localDrafts";
import { runTranscriptPipeline } from "@/lib/transcriptionClient";
import { formatDate, formatDuration } from "@/lib/utils";
import { useLocalDrafts } from "@/hooks/useLocalDrafts";
import { TranscriptEditor } from "./TranscriptEditor";
import type { LocalDraft, TranscriptDraft } from "@/types";

function statusCopy(draft: LocalDraft, isBusy: boolean) {
  if (isBusy) return "Working";
  if (draft.status === "failed") return "Needs attention";
  if (draft.status === "ready") return "Ready to save";
  if (draft.status === "recorded") return "Audio saved";
  if (draft.status === "transcribing") return "Transcribing";
  return "Local";
}

function statusClass(draft: LocalDraft, isBusy: boolean) {
  if (isBusy || draft.status === "transcribing") return "border-amber-300/20 bg-amber-300/10 text-amber-100/60";
  if (draft.status === "failed") return "border-red-300/20 bg-red-300/10 text-red-100/65";
  if (draft.status === "ready") return "border-green-300/20 bg-green-300/10 text-green-100/60";
  return "border-white/10 bg-white/[0.03] text-white/35";
}

function draftToTranscriptDraft(draft: LocalDraft): TranscriptDraft {
  return {
    localDraftId: draft.id,
    title: draft.title,
    transcript: draft.transcript,
    tags: draft.tags,
    duration: draft.duration,
    recordedAt: draft.recordedAt,
    processed: draft.processed,
  };
}

function downloadAudio(draft: LocalDraft) {
  const url = URL.createObjectURL(draft.audioBlob);
  const a = document.createElement("a");
  const ext = draft.audioType.includes("mp4")
    ? "mp4"
    : draft.audioType.includes("ogg")
      ? "ogg"
      : "webm";
  a.href = url;
  a.download = `voiceflow-${draft.recordedAt.slice(0, 19).replace(/[:T]/g, "-")}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function LocalDraftQueue() {
  const { drafts, isLoading, refresh } = useLocalDrafts();
  const [editingDraft, setEditingDraft] = useState<TranscriptDraft | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const unsynced = drafts.filter((draft) => draft.status !== "syncing");
  if (isLoading || unsynced.length === 0) return null;

  const retry = async (draft: LocalDraft) => {
    setBusyId(draft.id);
    try {
      const readyDraft = await runTranscriptPipeline(draft);
      setEditingDraft(readyDraft);
    } finally {
      setBusyId(null);
      await refresh();
    }
  };

  const remove = async (id: string) => {
    await deleteLocalDraft(id);
    await refresh();
  };

  const edit = async (draft: LocalDraft) => {
    if (draft.status === "failed" && !draft.transcript) {
      await updateLocalDraft(draft.id, { transcript: "", status: "ready", error: null });
      await refresh();
    }
    setEditingDraft(draftToTranscriptDraft(draft));
  };

  return (
    <>
      <section className="mx-auto mt-8 w-full max-w-xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/25">
            Draft Inbox
          </p>
          <span className="font-mono text-[10px] text-white/25">
            {unsynced.length}
          </span>
        </div>

        <div className="space-y-3">
          {unsynced.map((draft) => (
            <motion.div
              key={draft.id}
              layout
              className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white/85">{draft.title}</p>
                  <p className="mt-1 font-mono text-[11px] text-white/30">
                    {formatDate(draft.recordedAt)} / {formatDuration(draft.duration)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${statusClass(
                    draft,
                    busyId === draft.id
                  )}`}
                >
                  {statusCopy(draft, busyId === draft.id)}
                </span>
              </div>

              {draft.error && (
                <p className="mt-3 rounded-xl border border-red-300/10 bg-red-300/[0.04] px-3 py-2 text-xs leading-relaxed text-red-100/65">
                  {draft.error}
                </p>
              )}

              {draft.transcript && (
                <p className="mt-3 line-clamp-2 font-mono text-xs leading-relaxed text-white/35">
                  {draft.transcript}
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(draft.status === "failed" || draft.status === "recorded") && (
                  <button
                    onClick={() => retry(draft)}
                    disabled={busyId === draft.id}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-medium text-black disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Retry
                  </button>
                )}
                {(draft.status === "ready" || draft.status === "failed") && (
                  <button
                    onClick={() => edit(draft)}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-medium text-black"
                  >
                    <FilePenLine className="h-3.5 w-3.5" />
                    Review
                  </button>
                )}
                <button
                  onClick={() => downloadAudio(draft)}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-xs text-white/45 hover:text-white/70"
                >
                  <Download className="h-3.5 w-3.5" />
                  Audio
                </button>
                <button
                  onClick={() => remove(draft.id)}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-xs text-white/30 hover:text-white/55"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {editingDraft && (
          <TranscriptEditor
            draft={editingDraft}
            onClose={() => setEditingDraft(null)}
            onSaved={() => {
              setEditingDraft(null);
              void refresh();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
