export type NoteStatus = "New" | "Processing" | "Done" | "Archived";

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
  title: string;
  transcript: string;
  tags: string[];
  duration: number;
}

export type RecordingState = "idle" | "recording" | "processing" | "error";
