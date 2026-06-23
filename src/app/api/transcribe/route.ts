export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { toFile } from "openai";

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
    }

    const formData = await request.formData();
    const audioBlob = formData.get("audio") as Blob | null;

    if (!audioBlob) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    if (audioBlob.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "Audio too large (max 25MB)" }, { status: 413 });
    }

    if (audioBlob.size === 0) {
      return NextResponse.json({ error: "Audio is empty" }, { status: 400 });
    }

    const mimeType = audioBlob.type || "audio/webm";
    const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";

    const arrayBuffer = await audioBlob.arrayBuffer();
    const file = await toFile(Buffer.from(arrayBuffer), `recording.${ext}`, { type: mimeType });

    const openai = getOpenAI();
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "text",
    });

    console.info("voiceflow.metric", {
      event: "transcription_complete",
      durationMs: Date.now() - startedAt,
      audioBytes: audioBlob.size,
      mimeType,
    });

    return NextResponse.json({ transcript: transcription });
  } catch (err) {
    console.error("Transcription error:", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
