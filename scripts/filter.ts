import type { FetchedItem } from "./types.ts";

/**
 * 仅保留与科技、技术、AI、商业模式相关的内容，符合 Eyes 项目宗旨。
 * 匹配 title 或 description 中的关键词（不区分大小写）。
 */

const INCLUDE_KEYWORDS = [
  // 技术与开发
  "software", "code", "coding", "developer", "programming", "open source", "opensource",
  "api", "framework", "library", "tool", "cli", "sdk", "devops", "infrastructure",
  "database", "cloud", "server", "linux", "github", "git", "algorithm",
  "开源", "技术", "开发", "编程", "框架", "工具", "引擎",
  // AI / ML
  "ai", "ml", "machine learning", "llm", "gpt", "agent", "neural", "model",
  "deep learning", "nlp", "computer vision", "copilot", "chatgpt",
  "人工智能", "机器学习", "大模型", "agent", "智能",
  // 产品与商业
  "startup", "saas", "product", "business", "revenue", "growth", "launch",
  "indie", "side project", "monetization", "pricing", "b2b", "b2c",
  "创业", "商业模式", "产品", "融资", "增长", "独立开发", "变现",
  // 行业与政策（科技相关）
  "tech", "technology", "software industry", "tech company", "digital",
  "科技", "互联网", "软件", "数据", "安全", "隐私", "security", "privacy",
];

/** 排除：明显非科技/商业的领域（标题若以这些为主则过滤掉） */
const EXCLUDE_KEYWORDS = [
  "sports", "celebrity", "recipe", "movie review", "music chart",
  "体育", "娱乐八卦", "菜谱", "影评", "明星",
];

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function matchesAny(text: string, keywords: string[]): boolean {
  const n = normalize(text);
  return keywords.some((k) => n.includes(k.toLowerCase()));
}

/**
 * 过滤条目：保留与科技、技术、AI、商业模式相关的条目。
 * - 若 title 或 description 命中任一 INCLUDE_KEYWORDS → 保留
 * - 若 title 明显命中 EXCLUDE_KEYWORDS 且未命中 include → 排除
 * - 来源为 github-trending 的条目默认保留（均为技术仓库）
 */
export function filterRelevantItems(items: FetchedItem[]): FetchedItem[] {
  return items.filter((item) => {
    if (item.source === "github-trending") return true;

    const title = item.title || "";
    const desc = item.description || "";
    const combined = `${title} ${desc}`;

    if (matchesAny(combined, INCLUDE_KEYWORDS)) return true;
    if (matchesAny(title, EXCLUDE_KEYWORDS)) return false;

    return false;
  });
}
