import type { FetchedItem, SourceFetcher } from "../types.ts";

/**
 * Product Hunt uses a GraphQL API that requires a Developer Token.
 * Get yours at: https://www.producthunt.com/v2/oauth/applications
 *
 * Set env: PH_TOKEN=your_token_here
 *
 * Without a token, falls back to scraping the homepage.
 */

interface PHPost {
  id: string;
  name: string;
  tagline: string;
  url: string;
  website: string;
  votesCount: number;
  commentsCount: number;
  createdAt: string;
}

async function fetchViaAPI(date: string): Promise<FetchedItem[]> {
  const token = process.env.PH_TOKEN;
  if (!token) return [];

  const query = `{
    posts(order: VOTES, postedAfter: "${date}T00:00:00Z", postedBefore: "${date}T23:59:59Z", first: 20) {
      edges {
        node {
          id
          name
          tagline
          url
          website
          votesCount
          commentsCount
          createdAt
        }
      }
    }
  }`;

  const res = await fetch("https://api.producthunt.com/v2/api/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) return [];
  const data = await res.json();
  const posts: PHPost[] = data?.data?.posts?.edges?.map((e: { node: PHPost }) => e.node) ?? [];

  return posts.map((post) => ({
    id: `ph-${post.id}`,
    title: post.name,
    url: post.website || post.url,
    source: "producthunt" as const,
    score: post.votesCount,
    comments: post.commentsCount,
    commentsUrl: post.url,
    description: post.tagline,
    createdAt: post.createdAt,
  }));
}

async function fetchViaWebsite(): Promise<FetchedItem[]> {
  try {
    const res = await fetch("https://www.producthunt.com", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Eyes/1.0)" },
    });
    if (!res.ok) return [];
    const html = await res.text();

    const items: FetchedItem[] = [];
    const pattern = /data-test="post-name[^"]*"[^>]*>([^<]+)/g;
    let match;
    let idx = 0;
    while ((match = pattern.exec(html)) !== null && idx < 20) {
      items.push({
        id: `ph-web-${idx}`,
        title: match[1].trim(),
        url: "https://www.producthunt.com",
        source: "producthunt",
        createdAt: new Date().toISOString(),
      });
      idx++;
    }
    return items;
  } catch {
    return [];
  }
}

export const producthunt: SourceFetcher = {
  name: "producthunt",
  async fetch(date) {
    const apiItems = await fetchViaAPI(date);
    if (apiItems.length > 0) return apiItems;

    console.log("  [ProductHunt] No API token (PH_TOKEN), trying web fallback...");
    return fetchViaWebsite();
  },
};
