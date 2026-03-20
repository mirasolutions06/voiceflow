import { NextResponse } from "next/server";
import { getNotion, mapNotionPageToNote } from "@/lib/notion";
import { generateTitle } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { title, transcript, tags, duration } = (await request.json()) as {
      title: string;
      transcript: string;
      tags: string[];
      duration: number;
    };

    const notion = getNotion();
    const notionTitle = title?.trim() || generateTitle();

    const page = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID! },
      properties: {
        Name: {
          title: [{ text: { content: notionTitle } }],
        },
        Status: {
          select: { name: "New" },
        },
        Tags: {
          multi_select: (tags ?? []).map((t: string) => ({ name: t })),
        },
        RecordedAt: {
          date: { start: new Date().toISOString() },
        },
        Source: {
          select: { name: "VoiceFlow" },
        },
        Duration: {
          number: duration ?? null,
        },
        Transcript: {
          rich_text: [{ text: { content: transcript || "" } }],
        },
      },
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: transcript || "" } }],
          },
        },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ pageId: page.id, url: (page as any).url });
  } catch (err) {
    console.error("Notion save error:", err);
    return NextResponse.json({ error: "Failed to save to Notion" }, { status: 500 });
  }
}

export async function GET() {
  try {
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
