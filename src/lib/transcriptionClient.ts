"use client";

import type { LocalDraft, ProcessedTranscript, TranscriptDraft } from "@/types";
import { updateLocalDraft } from "@/lib/localDrafts";

export type PipelineStage = "saved" | "transcribing" | "cleaning" | "ready" | "failed";

async function readApiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("audio", blob);

  const startedAt = performance.now();
  const res = await fetch("/api/transcribe", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(await readApiError(res, "Transcription failed"));
  }

  const data = (await res.json()) as { transcript?: string };
  console.info("voiceflow.metric", {
    event: "transcription_client_complete",
    durationMs: Math.round(performance.now() - startedAt),
    audioBytes: blob.size,
  });

  if (!data.transcript) throw new Error("No transcript returned");
  return data.transcript;
}

export async function processTranscript(transcript: string): Promise<ProcessedTranscript | null> {
  const res = await fetch("/api/process-transcript", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { processed?: ProcessedTranscript };
  return data.processed ?? null;
}

export async function runTranscriptPipeline(
  draft: LocalDraft,
  onStage?: (stage: PipelineStage) => void
): Promise<TranscriptDraft> {
  onStage?.("saved");
  await updateLocalDraft(draft.id, { status: "transcribing", error: null });

  try {
    onStage?.("transcribing");
    const transcript = await transcribeAudio(draft.audioBlob);
    onStage?.("cleaning");
    const processed = await processTranscript(transcript);
    const nextTranscript = processed?.cleanedTranscript || transcript;
    const nextDraft = await updateLocalDraft(draft.id, {
      title: processed?.title || draft.title,
      transcript: nextTranscript,
      tags: processed?.tags ?? draft.tags,
      processed: processed ?? undefined,
      status: "ready",
      error: null,
    });

    onStage?.("ready");
    return {
      localDraftId: draft.id,
      title: nextDraft?.title || processed?.title || draft.title,
      transcript: nextTranscript,
      tags: nextDraft?.tags ?? processed?.tags ?? draft.tags,
      duration: draft.duration,
      recordedAt: draft.recordedAt,
      processed: processed ?? undefined,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Transcription failed";
    await updateLocalDraft(draft.id, { status: "failed", error });
    onStage?.("failed");
    throw err;
  }
}
