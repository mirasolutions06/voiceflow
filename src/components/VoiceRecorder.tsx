"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Pause, Play, Square } from "lucide-react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { TranscriptEditor } from "./TranscriptEditor";
import { formatDuration, generateTitle } from "@/lib/utils";
import { createLocalDraft, saveLocalDraft } from "@/lib/localDrafts";
import { runTranscriptPipeline, type PipelineStage } from "@/lib/transcriptionClient";
import type { TranscriptDraft } from "@/types";

const pipelineSteps: Array<{ key: PipelineStage; label: string }> = [
  { key: "saved", label: "Saved" },
  { key: "transcribing", label: "Transcribing" },
  { key: "cleaning", label: "Cleaning" },
  { key: "ready", label: "Ready" },
];

export function VoiceRecorder() {
  const {
    state,
    duration,
    analyserNode,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    error,
    reset,
  } = useAudioRecorder();
  const [draft, setDraft] = useState<TranscriptDraft | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage | null>(null);

  const handleButtonClick = async () => {
    if (state === "idle" || state === "error") {
      setNotice(null);
      setPipelineStage(null);
      await startRecording();
    } else if (state === "recording" || state === "paused") {
      const blob = await stopRecording();
      if (!blob) return;
      await prepareDraft(blob, duration);
    }
  };

  const prepareDraft = async (blob: Blob, dur: number) => {
    const localDraft = createLocalDraft(blob, generateTitle(), dur);
    await saveLocalDraft(localDraft);
    setPipelineStage("saved");
    setNotice("Recording saved locally");
    try {
      const readyDraft = await runTranscriptPipeline(localDraft, setPipelineStage);
      setDraft(readyDraft);
      setNotice(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transcription failed";
      setNotice(`${message}. Your recording is still saved below.`);
      reset();
    }
  };

  const isRecording = state === "recording";
  const isPaused = state === "paused";
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
            aria-label={isRecording || isPaused ? "Stop recording" : "Start recording"}
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
              ) : isRecording || isPaused ? (
                <motion.span
                  key="stop"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                >
                  {/* Stop square */}
                  <Square className="h-8 w-8 fill-black/70 text-black/70" strokeWidth={1.5} />
                </motion.span>
              ) : (
                <motion.span
                  key="mic"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Mic className="h-9 w-9 text-black/50" strokeWidth={1.5} />
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
          ) : isRecording || isPaused ? (
            <motion.p
              key={isPaused ? "paused" : "timer"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="font-mono text-sm tabular-nums text-white/50"
            >
              {isPaused ? `Paused at ${formatDuration(duration)}` : formatDuration(duration)}
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

        <AnimatePresence>
          {(isRecording || isPaused) && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-3"
            >
              <button
                onClick={isPaused ? resumeRecording : pauseRecording}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-white/45 transition-colors hover:border-white/20 hover:text-white/70"
              >
                {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                {isPaused ? "Resume" : "Pause"}
              </button>
              {isPaused && (
                <button
                  onClick={handleButtonClick}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-white/45 transition-colors hover:border-white/20 hover:text-white/70"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  Finish
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {pipelineStage && !isRecording && !isPaused && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="w-full max-w-[340px]"
            >
              <div className="grid grid-cols-4 gap-1.5">
                {pipelineSteps.map((step) => {
                  const currentIndex = pipelineSteps.findIndex((item) => item.key === pipelineStage);
                  const stepIndex = pipelineSteps.findIndex((item) => item.key === step.key);
                  const isActive = step.key === pipelineStage;
                  const isDone = currentIndex > stepIndex;

                  return (
                    <div
                      key={step.key}
                      className={`rounded-full border px-2 py-1.5 text-center font-mono text-[9px] uppercase tracking-wider ${
                        isDone
                          ? "border-green-300/20 bg-green-300/10 text-green-200/60"
                          : isActive
                            ? "border-white/20 bg-white/10 text-white/70"
                            : "border-white/[0.07] bg-white/[0.02] text-white/22"
                      }`}
                    >
                      {step.label}
                    </div>
                  );
                })}
              </div>
              {notice && (
                <p className="mt-3 text-center text-xs leading-relaxed text-white/40">
                  {notice}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {notice && !pipelineStage && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="max-w-[280px] text-center text-xs leading-relaxed text-white/40"
            >
              {notice}
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
            onClose={() => { setDraft(null); setPipelineStage(null); reset(); }}
            onSaved={() => { setDraft(null); setPipelineStage(null); reset(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
