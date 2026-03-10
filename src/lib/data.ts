import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

interface FetchedItem {
  id: string;
  title: string;
  url: string;
  source: string;
  score?: number;
  comments?: number;
  commentsUrl?: string;
  description?: string;
  createdAt: string;
  summary_zh?: string;
  title_zh?: string;
  image?: string;
  tags?: string[];
  valueScore?: number;
  insight?: string;
}

interface DailyData {
  date: string;
  fetchedAt: string;
  enrichedAt?: string;
  items: FetchedItem[];
}

const DATA_ROOT = resolve(process.cwd(), "data");

function readJSON(path: string): DailyData | null {
  try {
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

export function getDailyData(date: string): DailyData | null {
  const enrichedPath = resolve(DATA_ROOT, "enriched", `${date}.json`);
  const enriched = readJSON(enrichedPath);
  if (enriched) return enriched;

  const rawPath = resolve(DATA_ROOT, "raw", `${date}.json`);
  return readJSON(rawPath);
}

export function getAvailableDates(): string[] {
  const dates = new Set<string>();

  for (const dir of ["enriched", "raw"]) {
    const dirPath = resolve(DATA_ROOT, dir);
    if (!existsSync(dirPath)) continue;
    for (const file of readdirSync(dirPath)) {
      if (file.endsWith(".json")) {
        dates.add(file.replace(".json", ""));
      }
    }
  }

  return [...dates].sort().reverse();
}

export function getLatestDate(): string | null {
  const dates = getAvailableDates();
  return dates[0] ?? null;
}

export function getAdjacentDates(date: string): { prev: string | null; next: string | null } {
  const dates = getAvailableDates();
  const idx = dates.indexOf(date);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: dates[idx + 1] ?? null,
    next: dates[idx - 1] ?? null,
  };
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export type { FetchedItem, DailyData };
