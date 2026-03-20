"use client";

import { useWaveform } from "@/hooks/useWaveform";

interface WaveformVisualizerProps {
  analyserNode: AnalyserNode | null;
}

export function WaveformVisualizer({ analyserNode }: WaveformVisualizerProps) {
  const { canvasRef } = useWaveform(analyserNode);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={48}
      className="w-full max-w-[280px] rounded-lg opacity-80"
    />
  );
}
