export type NoteStatus = "New" | "Processing" | "Processed" | "Done" | "Archived";

export interface ProcessedTranscript {
  title: string;
  summary: string;
  tags: string[];
  actionItems: string[];
  decisions: string[];
  followUps: string[];
  cleanedTranscript: string;
}

export interface Note {
  id: string;
  title: string;
  transcript: string;
  status: NoteStatus;
  tags: string[];
  recordedAt: string;
  processedAt: string | null;
  miraOutput: string | null;
  actionItems: string | null;
  duration: number | null;
  notionUrl: string;
}

export interface TranscriptDraft {
  localDraftId?: string;
  title: string;
  transcript: string;
  tags: string[];
  duration: number;
  recordedAt?: string;
  processed?: ProcessedTranscript;
}

export type LocalDraftStatus =
  | "recorded"
  | "transcribing"
  | "ready"
  | "syncing"
  | "failed";

export interface LocalDraft {
  id: string;
  title: string;
  transcript: string;
  tags: string[];
  duration: number;
  recordedAt: string;
  status: LocalDraftStatus;
  error: string | null;
  audioBlob: Blob;
  audioType: string;
  processed?: ProcessedTranscript;
}

export type RecordingState = "idle" | "recording" | "paused" | "processing" | "error";
