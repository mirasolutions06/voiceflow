"use client";

import { VoiceRecorder } from "@/components/VoiceRecorder";
import { BottomSheet } from "@/components/BottomSheet";
import { TopBar } from "@/components/TopBar";

export default function Home() {
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <TopBar />

      {/* Center stage — recorder is the hero, always on screen */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-28">
        <VoiceRecorder />
      </main>

      {/* Notes live in a pull-up sheet, not a scrolling page */}
      <BottomSheet />
    </div>
  );
}
