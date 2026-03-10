import type { FetchedItem, SourceFetcher } from "../types.ts";

interface DevToArticle {
  id: number;
  title: string;
  url: string;
  description: string;
  public_reactions_count: number;
  comments_count: number;
  published_at: string;
  tag_list: string[];
}

export const devto: SourceFetcher = {
  name: "devto",
  async fetch(_date) {
    try {
      const res = await fetch("https://dev.to/api/articles?top=1&per_page=20", {
        headers: { "User-Agent": "Eyes/1.0" },
      });
      if (!res.ok) throw new Error(`dev.to API failed: ${res.status}`);
      const articles: DevToArticle[] = await res.json();

      return articles.map((a) => ({
        id: `dt-${a.id}`,
        title: a.title,
        url: a.url,
        source: "devto" as const,
        score: a.public_reactions_count,
        comments: a.comments_count,
        commentsUrl: a.url + "#comments",
        description: a.description?.slice(0, 300) || undefined,
        createdAt: a.published_at,
      }));
    } catch (err) {
      console.error("  [dev.to] Fetch failed:", (err as Error).message);
      return [];
    }
  },
};
