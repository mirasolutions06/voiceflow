"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { LoadingDots } from "./LoadingDots";
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
      <div className="flex flex-col items-center gap-6">
        {/* Record Button */}
        <div className="relative flex items-center justify-center">
          {/* Pulse ring (idle only) */}
          <AnimatePresence>
            {isIdle && (
              <motion.span
                key="pulse"
                className="absolute rounded-full border border-white/10"
                initial={{ width: 96, height: 96, opacity: 0.6 }}
                animate={{ width: 130, height: 130, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
            )}
          </AnimatePresence>

          <motion.button
            onClick={handleButtonClick}
            disabled={isProcessing}
            whileTap={{ scale: 0.92 }}
            animate={{
              backgroundColor: isRecording ? "#ef4444" : "rgba(255,255,255,0.08)",
            }}
            transition={{ duration: 0.2 }}
            className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full border border-white/[0.12] backdrop-blur-xl disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.span
                  key="processing"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <LoadingDots />
                </motion.span>
              ) : isRecording ? (
                <motion.span
                  key="stop"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  {/* Stop square */}
                  <span className="block h-5 w-5 rounded-sm bg-white" />
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
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(255,255,255,0.7)"
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

        {/* Status label + timer */}
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.p
              key="transcribing"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="font-mono text-xs text-white/40"
            >
              Transcribing
            </motion.p>
          ) : isRecording ? (
            <motion.p
              key="timer"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="font-mono text-sm tabular-nums text-white/60"
            >
              {formatDuration(duration)}
            </motion.p>
          ) : (
            <motion.p
              key="idle-label"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-xs text-white/35"
            >
              {error ? "Mic access denied — try again" : "Tap to record"}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Waveform */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full overflow-hidden"
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
