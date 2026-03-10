import type { FetchedItem, SourceFetcher } from "../types.ts";

interface TrendingRepo {
  author: string;
  name: string;
  url: string;
  description: string;
  stars: number;
  currentPeriodStars: number;
  language: string;
}

export const githubTrending: SourceFetcher = {
  name: "github-trending",
  async fetch(_date) {
    const repos = await scrapeTrending();

    return repos.slice(0, 25).map((repo) => ({
      id: `gh-${repo.author}-${repo.name}`,
      title: `${repo.author}/${repo.name}`,
      url: repo.url,
      source: "github-trending" as const,
      score: repo.currentPeriodStars || repo.stars,
      description: repo.description
        ? `${repo.description}${repo.language ? ` [${repo.language}]` : ""}`
        : repo.language || undefined,
      createdAt: new Date().toISOString(),
    }));
  },
};

async function scrapeTrending(): Promise<TrendingRepo[]> {
  try {
    const res = await fetch("https://github.com/trending?since=daily", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html",
      },
    });
    if (!res.ok) return [];
    const html = await res.text();

    const repos: TrendingRepo[] = [];

    // The repo heading links are inside <h2> tags with "lh-condensed" class
    // Pattern: <h2 ...><a href="/author/repo">...</a></h2>
    const headingPattern = /<h2[^>]*lh-condensed[^>]*>[\s\S]*?<a[^>]*href="\/([^/\s"]+)\/([^"\s]+)"[^>]*>/g;
    let match;
    const seen = new Set<string>();

    while ((match = headingPattern.exec(html)) !== null) {
      const author = match[1].trim();
      const name = match[2].trim();
      const key = `${author}/${name}`;

      if (seen.has(key)) continue;
      if (["trending", "topics", "collections", "explore", "sponsors", "login", "signup"].includes(author)) continue;
      if (name.includes("?") || name.includes("=")) continue;
      seen.add(key);

      // Look for today's stars in the surrounding context (next ~2000 chars)
      const afterIdx = match.index + match[0].length;
      const contextEnd = Math.min(afterIdx + 3000, html.length);
      const context = html.slice(afterIdx, contextEnd);

      const todayMatch = context.match(/([\d,]+)\s*stars?\s*today/i);
      const currentPeriodStars = todayMatch ? parseInt(todayMatch[1].replace(/,/g, ""), 10) : 0;

      const descMatch = context.match(/<p[^>]*class="[^"]*col-9[^"]*"[^>]*>([\s\S]*?)<\/p>/);
      const description = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim() : "";

      const langMatch = context.match(/itemprop="programmingLanguage"[^>]*>([^<]+)/);
      const language = langMatch ? langMatch[1].trim() : "";

      repos.push({
        author,
        name,
        url: `https://github.com/${author}/${name}`,
        description,
        stars: 0,
        currentPeriodStars,
        language,
      });
    }

    return repos;
  } catch {
    return [];
  }
}
