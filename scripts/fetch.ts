import "./load-env.ts";
import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from "node:fs";
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

/** 去重时参考过去 N 天的 raw + enriched，避免同一 URL 多日重复 */
const DEDUPE_DAYS = 7;

const ALL_SOURCES: SourceFetcher[] = [
  hackernews,
  lobsters,
  githubTrending,
  producthunt,
  devto,
  ...rssFetchers,
];

/** 收集过去 N 天内 raw/enriched 已出现过的 URL（不含 targetDate） */
function getSeenUrls(targetDate: string): Set<string> {
  const seen = new Set<string>();
  const rawDir = resolve(PROJECT_ROOT, "data", "raw");
  const enrichedDir = resolve(PROJECT_ROOT, "data", "enriched");
  const dirs = [
    ...(existsSync(rawDir) ? [{ dir: rawDir, name: "raw" }] : []),
    ...(existsSync(enrichedDir) ? [{ dir: enrichedDir, name: "enriched" }] : []),
  ];
  const target = new Date(targetDate);
  for (const { dir } of dirs) {
    const files = readdirSync(dir).filter((f) => f.endsWith(".json") && /^\d{4}-\d{2}-\d{2}\.json$/.test(f));
    for (const f of files) {
      const fileDate = f.slice(0, 10);
      if (fileDate === targetDate) continue; // 排除当天
      const fd = new Date(fileDate);
      const diffDays = (target.getTime() - fd.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > DEDUPE_DAYS) continue;
      try {
        const json = JSON.parse(readFileSync(resolve(dir, f), "utf-8"));
        for (const it of json.items || []) {
          if (it.url) seen.add(it.url);
        }
      } catch {
        /* ignore */
      }
    }
  }
  return seen;
}

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

  const seenUrls = getSeenUrls(date);
  const beforeDedupe = allItems.length;
  allItems = allItems.filter((it) => !seenUrls.has(it.url));
  const deduped = beforeDedupe - allItems.length;
  if (deduped > 0) {
    console.log(`  [Dedupe] 排除过去 ${DEDUPE_DAYS} 天内已出现的 URL: ${allItems.length} 条（排除 ${deduped} 条重复）`);
  }

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
