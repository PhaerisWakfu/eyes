export type Source =
  | "hackernews"
  | "producthunt"
  | "lobsters"
  | "github-trending"
  | "devto"
  | "changelog";

export interface FetchedItem {
  id: string;
  title: string;
  url: string;
  source: Source;
  score?: number;
  comments?: number;
  commentsUrl?: string;
  description?: string;
  createdAt: string;
}

export interface EnrichedItem extends FetchedItem {
  /** 中文总结（面向国内用户，必填） */
  summary_zh: string;
  /** 标题中文翻译（可选，便于快速浏览） */
  title_zh?: string;
  /** 文章/项目配图 URL（可选） */
  image?: string;
  tags: string[];
  valueScore: number;
  insight?: string;
}

export interface DailyData {
  date: string;
  fetchedAt: string;
  items: FetchedItem[];
}

export interface EnrichedDailyData {
  date: string;
  fetchedAt: string;
  enrichedAt: string;
  items: EnrichedItem[];
}

export interface SourceFetcher {
  name: Source;
  fetch: (date: string) => Promise<FetchedItem[]>;
}
