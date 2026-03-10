import RSSParser from "rss-parser";
import type { FetchedItem, Source, SourceFetcher } from "../types.ts";

const parser = new RSSParser();

interface RSSSourceConfig {
  name: Source;
  feedUrl: string;
  limit: number;
}

const RSS_SOURCES: RSSSourceConfig[] = [
  {
    name: "changelog",
    feedUrl: "https://changelog.com/news/feed",
    limit: 20,
  },
];

function createRSSFetcher(config: RSSSourceConfig): SourceFetcher {
  return {
    name: config.name,
    async fetch(_date) {
      try {
        const feed = await parser.parseURL(config.feedUrl);
        return feed.items.slice(0, config.limit).map((item, idx) => ({
          id: `${config.name.slice(0, 2)}-${item.guid || idx}`,
          title: item.title || "Untitled",
          url: item.link || "",
          source: config.name,
          description: item.contentSnippet?.slice(0, 300) || item.content?.slice(0, 300) || undefined,
          createdAt: item.isoDate || item.pubDate || new Date().toISOString(),
        }));
      } catch (err) {
        console.error(`  [${config.name}] RSS fetch failed:`, (err as Error).message);
        return [];
      }
    },
  };
}

export const rssFetchers = RSS_SOURCES.map(createRSSFetcher);
