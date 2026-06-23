import { NextResponse } from "next/server";
import { getNotion, mapNotionPageToNote } from "@/lib/notion";
import { generateTitle } from "@/lib/utils";
import type { ProcessedTranscript } from "@/types";

const NOTION_TEXT_LIMIT = 1900;

interface SaveNoteRequest {
  title: string;
  transcript: string;
  tags: string[];
  duration: number | null;
  recordedAt: string;
  processed?: ProcessedTranscript;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function textList(value: unknown, max = 12): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(text).filter(Boolean).slice(0, max);
}

function validDate(value: unknown): string {
  const raw = text(value);
  if (!raw) return new Date().toISOString();
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function parseProcessed(value: unknown): ProcessedTranscript | undefined {
  if (!value || typeof value !== "object") return undefined;
  const data = value as Record<string, unknown>;
  return {
    title: text(data.title),
    summary: text(data.summary),
    tags: textList(data.tags, 8),
    actionItems: textList(data.actionItems),
    decisions: textList(data.decisions),
    followUps: textList(data.followUps),
    cleanedTranscript: text(data.cleanedTranscript),
  };
}

function parseSaveRequest(value: unknown): SaveNoteRequest {
  const data = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const transcript = text(data.transcript);
  if (!transcript) throw new Error("Transcript is required");

  const duration = typeof data.duration === "number" && Number.isFinite(data.duration)
    ? Math.max(0, Math.round(data.duration))
    : null;

  return {
    title: text(data.title).slice(0, 120) || generateTitle(),
    transcript,
    tags: textList(data.tags, 8).map((tag) => tag.replace(/^#/, "").slice(0, 40)),
    duration,
    recordedAt: validDate(data.recordedAt),
    processed: parseProcessed(data.processed),
  };
}

function truncateForProperty(value: string): string {
  if (value.length <= NOTION_TEXT_LIMIT) return value;
  return `${value.slice(0, NOTION_TEXT_LIMIT - 3)}...`;
}

function richText(value: string) {
  const chunks = value.match(new RegExp(`[\\s\\S]{1,${NOTION_TEXT_LIMIT}}`, "g")) ?? [""];
  return chunks.map((chunk) => ({ type: "text" as const, text: { content: chunk } }));
}

function paragraph(content: string) {
  return {
    object: "block" as const,
    type: "paragraph" as const,
    paragraph: { rich_text: richText(content) },
  };
}

function heading(content: string) {
  return {
    object: "block" as const,
    type: "heading_2" as const,
    heading_2: { rich_text: richText(content) },
  };
}

function bullets(items: string[]) {
  return items.map((item) => ({
    object: "block" as const,
    type: "bulleted_list_item" as const,
    bulleted_list_item: { rich_text: richText(item) },
  }));
}

function buildChildren(note: SaveNoteRequest) {
  const children = [];
  const processed = note.processed;

  if (processed?.summary) {
    children.push(heading("Summary"), paragraph(processed.summary));
  }
  if (processed?.actionItems.length) {
    children.push(heading("Action items"), ...bullets(processed.actionItems));
  }
  if (processed?.decisions.length) {
    children.push(heading("Decisions"), ...bullets(processed.decisions));
  }
  if (processed?.followUps.length) {
    children.push(heading("Follow-ups"), ...bullets(processed.followUps));
  }

  children.push(heading("Transcript"), paragraph(note.transcript));
  return children.slice(0, 100);
}

function missingEnv(names: string[]) {
  return names.filter((name) => !process.env[name]);
}

export async function POST(request: Request) {
  try {
    const missing = missingEnv(["NOTION_API_KEY", "NOTION_DATABASE_ID"]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing Notion config: ${missing.join(", ")}` },
        { status: 500 }
      );
    }

    const note = parseSaveRequest(await request.json());

    const notion = getNotion();

    const page = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID! },
      properties: {
        Name: {
          title: [{ text: { content: note.title } }],
        },
        Status: {
          select: { name: "New" },
        },
        Tags: {
          multi_select: note.tags.map((tag) => ({ name: tag })),
        },
        RecordedAt: {
          date: { start: note.recordedAt },
        },
        Source: {
          select: { name: "VoiceFlow" },
        },
        Duration: {
          number: note.duration,
        },
        Transcript: {
          rich_text: [{ text: { content: truncateForProperty(note.transcript) } }],
        },
      },
      children: buildChildren(note),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ pageId: page.id, url: (page as any).url });
  } catch (err) {
    console.error("Notion save error:", err);
    const message = err instanceof Error ? err.message : "Failed to save to Notion";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("health") === "1") {
      return NextResponse.json({
        ok: missingEnv(["NOTION_API_KEY", "NOTION_DATABASE_ID", "NOTION_DATA_SOURCE_ID"]).length === 0,
        missing: missingEnv(["NOTION_API_KEY", "NOTION_DATABASE_ID", "NOTION_DATA_SOURCE_ID"]),
      });
    }

    const missing = missingEnv(["NOTION_API_KEY", "NOTION_DATA_SOURCE_ID"]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing Notion config: ${missing.join(", ")}` },
        { status: 500 }
      );
    }

    const notion = getNotion();
    const response = await notion.dataSources.query({
      data_source_id: process.env.NOTION_DATA_SOURCE_ID!,
      sorts: [{ property: "RecordedAt", direction: "descending" }],
      page_size: 20,
    });

    const notes = response.results.map(mapNotionPageToNote);
    return NextResponse.json({ notes });
  } catch (err) {
    console.error("Notion fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}
