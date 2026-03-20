"use client";

import { VoiceRecorder } from "@/components/VoiceRecorder";
import { NoteHistory } from "@/components/NoteHistory";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#0a0a0a]">
      {/* Desktop: subtle side borders to frame the mobile column */}
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col border-x border-white/[0.04] px-5 pt-14 pb-10">
        {/* Header */}
        <p className="mb-12 text-center font-mono text-[11px] tracking-[0.3em] text-white/30 uppercase">
          VoiceFlow
        </p>

        {/* Recorder */}
        <div className="flex flex-col items-center">
          <VoiceRecorder />
        </div>

        {/* Divider */}
        <div className="my-8 h-px w-full bg-white/[0.06]" />

        {/* Note history */}
        <NoteHistory />
      </div>
    </div>
  );
}
