"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { TranscriptEditor } from "./TranscriptEditor";
import { formatDuration, generateTitle } from "@/lib/utils";
import type { TranscriptDraft } from "@/types";

export function VoiceRecorder() {
  const { state, duration, analyserNode, startRecording, stopRecording, error, reset } =
    useAudioRecorder();
  const [draft, setDraft] = useState<TranscriptDraft | null>(null);

  const handleButtonClick = async () => {
    if (state === "idle" || state === "error") {
      await startRecording();
    } else if (state === "recording") {
      const blob = await stopRecording();
      if (!blob) return;
      await transcribeBlob(blob, duration);
    }
  };

  const transcribeBlob = async (blob: Blob, dur: number) => {
    const formData = new FormData();
    formData.append("audio", blob);

    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.transcript) {
        setDraft({
          title: generateTitle(),
          transcript: data.transcript,
          tags: [],
          duration: dur,
        });
      } else {
        reset();
      }
    } catch {
      reset();
    }
  };

  const isRecording = state === "recording";
  const isProcessing = state === "processing";
  const isIdle = state === "idle" || state === "error";

  return (
    <>
      <div className="flex flex-col items-center gap-7">
        {/* Record Button */}
        <div className="relative flex items-center justify-center">
          {/* Idle: outward pulse ring */}
          <AnimatePresence>
            {isIdle && (
              <motion.span
                key="idle-pulse"
                className="absolute rounded-full border border-white/15"
                initial={{ width: 208, height: 208, opacity: 0.5 }}
                animate={{ width: 270, height: 270, opacity: 0 }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
              />
            )}
          </AnimatePresence>

          {/* Recording: breathing ring */}
          <AnimatePresence>
            {isRecording && (
              <motion.span
                key="rec-ring"
                className="absolute rounded-full border border-white/20"
                animate={{
                  width: [208, 248, 208],
                  height: [208, 248, 208],
                  opacity: [0.25, 0, 0.25],
                }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </AnimatePresence>

          {/* Main circle button — always white */}
          <motion.button
            onClick={handleButtonClick}
            disabled={isProcessing}
            whileTap={{ scale: 0.94 }}
            className="relative z-10 flex h-52 w-52 items-center justify-center rounded-full bg-white shadow-[0_0_60px_rgba(255,255,255,0.08)] disabled:cursor-not-allowed disabled:opacity-70"
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.span
                  key="processing"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-1.5"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="inline-block h-2 w-2 rounded-full bg-black/40"
                      animate={{ opacity: [0.2, 0.8, 0.2] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </motion.span>
              ) : isRecording ? (
                <motion.span
                  key="stop"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                >
                  {/* Stop square */}
                  <span className="block h-6 w-6 rounded-[4px] bg-black/70" />
                </motion.span>
              ) : (
                <motion.span
                  key="mic"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  {/* Mic icon */}
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="2" width="6" height="12" rx="3" />
                    <path d="M5 10a7 7 0 0 0 14 0" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                    <line x1="9" y1="22" x2="15" y2="22" />
                  </svg>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Status / timer */}
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.p
              key="transcribing"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="font-mono text-xs tracking-widest text-white/35 uppercase"
            >
              Transcribing
            </motion.p>
          ) : isRecording ? (
            <motion.p
              key="timer"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="font-mono text-sm tabular-nums text-white/50"
            >
              {formatDuration(duration)}
            </motion.p>
          ) : (
            <motion.p
              key="idle-label"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="font-mono text-xs tracking-widest text-white/30 uppercase"
            >
              {error ? "Mic access denied" : "Tap to record"}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Waveform — shown during recording */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full max-w-[240px] overflow-hidden"
            >
              <WaveformVisualizer analyserNode={analyserNode} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* TranscriptEditor sheet */}
      <AnimatePresence>
        {draft && (
          <TranscriptEditor
            draft={draft}
            onClose={() => { setDraft(null); reset(); }}
            onSaved={() => { setDraft(null); reset(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
