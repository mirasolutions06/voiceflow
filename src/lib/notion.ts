import { Client } from "@notionhq/client";
import type { Note, NoteStatus } from "@/types";

let _client: Client | null = null;

export function getNotion(): Client {
  if (!_client) {
    _client = new Client({ auth: process.env.NOTION_API_KEY });
  }
  return _client;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapNotionPageToNote(page: any): Note {
  const props = page.properties;
  return {
    id: page.id,
    title: props.Name?.title?.[0]?.plain_text ?? "Untitled",
    transcript: props.Transcript?.rich_text?.[0]?.plain_text ?? "",
    status: (props.Status?.select?.name ?? "New") as NoteStatus,
    tags: props.Tags?.multi_select?.map((t: { name: string }) => t.name) ?? [],
    recordedAt: props.RecordedAt?.date?.start ?? page.created_time,
    processedAt: props.ProcessedAt?.date?.start ?? null,
    miraOutput: props.MiraOutput?.rich_text?.[0]?.plain_text ?? null,
    actionItems: props.ActionItems?.rich_text?.[0]?.plain_text ?? null,
    duration: props.Duration?.number ?? null,
    notionUrl: page.url,
  };
}
