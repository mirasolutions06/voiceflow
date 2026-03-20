import { Client } from "@notionhq/client";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
const get = (key) => env.match(new RegExp(`^${key}=(.+)$`, "m"))?.[1]?.trim();

const notion = new Client({ auth: get("NOTION_API_KEY") });
const dataSourceId = get("NOTION_DATA_SOURCE_ID");
const dbId = get("NOTION_DATABASE_ID");

console.log("Testing Notion connection...");
console.log("Data Source ID:", dataSourceId);

try {
  const res = await notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: 1,
  });
  console.log("✓ Connected! Data source is accessible.");
  console.log(`  Found ${res.results.length} existing entries.`);
} catch (err) {
  console.error("✗ Data source query failed:", err.message);

  // Fallback: try via pages API
  console.log("\nTrying pages API fallback...");
  try {
    await notion.pages.retrieve({ page_id: dbId });
    console.log("✓ Database page accessible via pages API.");
  } catch (e2) {
    console.error("✗ Pages API also failed:", e2.message);
    console.log("\nTo fix: open VoiceFlow Notes in Notion → ••• (top right) → Connections → connect 'voice flow'");
  }
}
