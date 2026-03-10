import type { FetchedItem, SourceFetcher } from "../types.ts";

interface LobstersItem {
  short_id: string;
  title: string;
  url: string;
  score: number;
  comment_count: number;
  comments_url: string;
  description: string;
  created_at: string;
}

export const lobsters: SourceFetcher = {
  name: "lobsters",
  async fetch(_date) {
    const res = await fetch("https://lobste.rs/hottest.json");
    if (!res.ok) throw new Error(`Lobsters fetch failed: ${res.status}`);
    const data: LobstersItem[] = await res.json();

    return data.slice(0, 30).map((item) => ({
      id: `lb-${item.short_id}`,
      title: item.title,
      url: item.url || item.comments_url,
      source: "lobsters" as const,
      score: item.score,
      comments: item.comment_count,
      commentsUrl: item.comments_url,
      description: item.description || undefined,
      createdAt: item.created_at,
    }));
  },
};
