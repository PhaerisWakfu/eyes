import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { DailyData, SourceFetcher, FetchedItem } from "./types.ts";
import { filterRelevantItems } from "./filter.ts";
import { hackernews } from "./sources/hackernews.ts";
import { lobsters } from "./sources/lobsters.ts";
import { githubTrending } from "./sources/github-trending.ts";
import { producthunt } from "./sources/producthunt.ts";
import { devto } from "./sources/devto.ts";
import { rssFetchers } from "./sources/rss.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");

const ALL_SOURCES: SourceFetcher[] = [
  hackernews,
  lobsters,
  githubTrending,
  producthunt,
  devto,
  ...rssFetchers,
];

function getTargetDate(): string {
  const arg = process.argv[2];
  if (arg && /^\d{4}-\d{2}-\d{2}$/.test(arg)) {
    return arg;
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
}

async function fetchSource(source: SourceFetcher, date: string): Promise<FetchedItem[]> {
  try {
    console.log(`  Fetching [${source.name}]...`);
    const items = await source.fetch(date);
    console.log(`  [${source.name}] → ${items.length} items`);
    return items;
  } catch (err) {
    console.error(`  [${source.name}] FAILED:`, (err as Error).message);
    return [];
  }
}

async function main() {
  const date = getTargetDate();
  console.log(`\n=== Eyes Fetch: ${date} ===\n`);

  const results = await Promise.allSettled(
    ALL_SOURCES.map((source) => fetchSource(source, date))
  );

  let allItems: FetchedItem[] = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );

  const beforeFilter = allItems.length;
  allItems = filterRelevantItems(allItems);
  const filteredOut = beforeFilter - allItems.length;
  if (filteredOut > 0) {
    console.log(`\n  [Filter] 保留科技/技术/AI/商业模式相关: ${allItems.length} 条（过滤掉 ${filteredOut} 条）`);
  }

  allItems.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const itemsForRaw = allItems.map(({ comments, commentsUrl, ...rest }) => rest);
  const dailyData: DailyData = {
    date,
    fetchedAt: new Date().toISOString(),
    items: itemsForRaw,
  };

  const rawDir = resolve(PROJECT_ROOT, "data", "raw");
  if (!existsSync(rawDir)) {
    mkdirSync(rawDir, { recursive: true });
  }

  const outPath = resolve(rawDir, `${date}.json`);
  writeFileSync(outPath, JSON.stringify(dailyData, null, 2), "utf-8");

  const enrichedDir = resolve(PROJECT_ROOT, "data", "enriched");
  if (!existsSync(enrichedDir)) {
    mkdirSync(enrichedDir, { recursive: true });
  }

  console.log(`\n✓ Saved ${allItems.length} items → ${outPath}`);

  const bySource = new Map<string, number>();
  for (const item of allItems) {
    bySource.set(item.source, (bySource.get(item.source) || 0) + 1);
  }
  console.log("\nBreakdown:");
  for (const [source, count] of bySource) {
    console.log(`  ${source}: ${count}`);
  }
  console.log("");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
