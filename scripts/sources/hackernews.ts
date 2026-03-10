import type { FetchedItem, SourceFetcher } from "../types.ts";

const HN_API = "https://hacker-news.firebaseio.com/v0";
const TOP_LIMIT = 30;

interface HNItem {
  id: number;
  title?: string;
  url?: string;
  score?: number;
  descendants?: number;
  time?: number;
  type?: string;
}

async function fetchItem(id: number): Promise<HNItem | null> {
  try {
    const res = await fetch(`${HN_API}/item/${id}.json`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchTopStoryIds(): Promise<number[]> {
  const res = await fetch(`${HN_API}/topstories.json`);
  if (!res.ok) throw new Error(`HN topstories failed: ${res.status}`);
  const ids: number[] = await res.json();
  return ids.slice(0, TOP_LIMIT);
}

export const hackernews: SourceFetcher = {
  name: "hackernews",
  async fetch(_date) {
    const ids = await fetchTopStoryIds();
    const items = await Promise.all(ids.map(fetchItem));

    return items
      .filter((item): item is HNItem => item !== null && item.type === "story" && !!item.title)
      .map((item) => ({
        id: `hn-${item.id}`,
        title: item.title!,
        url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
        source: "hackernews" as const,
        score: item.score,
        comments: item.descendants,
        commentsUrl: `https://news.ycombinator.com/item?id=${item.id}`,
        createdAt: item.time ? new Date(item.time * 1000).toISOString() : new Date().toISOString(),
      }));
  },
};
