"use client";

import { VoiceRecorder } from "@/components/VoiceRecorder";
import { NoteHistory } from "@/components/NoteHistory";
import { LocalDraftQueue } from "@/components/LocalDraftQueue";
import { CaptureStatus } from "@/components/CaptureStatus";

export default function Home() {
  return (
    <div className="min-h-dvh bg-[#0a0a0a]">
      {/* Header */}
      <header className="flex items-center justify-center pt-12">
        <p className="font-mono text-[11px] tracking-[0.3em] text-white/25 uppercase">
          VoiceFlow
        </p>
      </header>

      {/* Hero — recorder centered in upper portion of screen */}
      <div className="flex min-h-[62dvh] flex-col items-center justify-center px-6">
        <VoiceRecorder />
        <CaptureStatus />
      </div>

      {/* History zone */}
      <div className="px-5 pb-12">
        <LocalDraftQueue />

        <div className="mb-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <span className="font-mono text-[10px] tracking-[0.25em] text-white/25 uppercase">
            Recent
          </span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>
        <NoteHistory />
      </div>
    </div>
  );
}
