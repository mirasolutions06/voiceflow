export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import type { ProcessedTranscript } from "@/types";

const MAX_TRANSCRIPT_CHARS = 80_000;

const transcriptSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "summary",
    "tags",
    "actionItems",
    "decisions",
    "followUps",
    "cleanedTranscript",
  ],
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    tags: {
      type: "array",
      items: { type: "string" },
      maxItems: 8,
    },
    actionItems: {
      type: "array",
      items: { type: "string" },
      maxItems: 12,
    },
    decisions: {
      type: "array",
      items: { type: "string" },
      maxItems: 12,
    },
    followUps: {
      type: "array",
      items: { type: "string" },
      maxItems: 12,
    },
    cleanedTranscript: { type: "string" },
  },
};

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(asString).filter(Boolean).slice(0, 12);
}

function validateProcessed(value: unknown, fallbackTranscript: string): ProcessedTranscript {
  const data = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const cleanedTranscript = asString(data.cleanedTranscript) || fallbackTranscript;
  const title = asString(data.title) || "Voice note";

  return {
    title: title.slice(0, 120),
    summary: asString(data.summary),
    tags: asStringArray(data.tags).slice(0, 8),
    actionItems: asStringArray(data.actionItems),
    decisions: asStringArray(data.decisions),
    followUps: asStringArray(data.followUps),
    cleanedTranscript,
  };
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const body = (await request.json()) as { transcript?: unknown };
    const transcript = asString(body.transcript);

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    if (transcript.length > MAX_TRANSCRIPT_CHARS) {
      return NextResponse.json({ error: "Transcript too long" }, { status: 413 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
    }

    const openai = getOpenAI();
    const model = process.env.OPENAI_PROCESSING_MODEL || "gpt-4o-mini";
    const completion = await openai.chat.completions.create({
      model,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "voiceflow_processed_transcript",
          strict: true,
          schema: transcriptSchema,
        },
      },
      messages: [
        {
          role: "system",
          content:
            "Turn a dictated note into a clean capture artifact. Preserve meaning, remove filler, do not invent facts, and keep tags short lowercase words.",
        },
        {
          role: "user",
          content: transcript,
        },
      ],
    });

    const content = completion.choices[0]?.message.content;
    if (!content) throw new Error("No processing output returned");

    const processed = validateProcessed(JSON.parse(content), transcript);

    console.info("voiceflow.metric", {
      event: "transcript_processing_complete",
      model,
      durationMs: Date.now() - startedAt,
      transcriptChars: transcript.length,
    });

    return NextResponse.json({ processed });
  } catch (err) {
    console.error("Transcript processing error:", err);
    return NextResponse.json({ error: "Transcript processing failed" }, { status: 500 });
  }
}
