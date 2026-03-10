import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

type AnyItem = {
  id: string;
  title: string;
  title_zh?: string;
  url: string;
  source: string;
  createdAt: string;
  description?: string;
  summary_zh?: string;
  tags?: string[];
  valueScore?: number;
  image?: string;
};

type AnyDaily = {
  date: string;
  fetchedAt: string;
  enrichedAt?: string;
  items: AnyItem[];
};

const MAX_EXPORT = 20;

function usage() {
  console.log("用法：npm run wechat -- 2026-03-09");
  console.log("说明：读取 data/enriched 或 data/raw，导出 Markdown 到 exports/{date}.md，图片引用 data/assets/");
}

function pickDateArg(): string | null {
  const arg = process.argv[2];
  if (!arg) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(arg) ? arg : null;
}

function readDaily(date: string): AnyDaily {
  const enriched = resolve(process.cwd(), "data", "enriched", `${date}.json`);
  const raw = resolve(process.cwd(), "data", "raw", `${date}.json`);
  const path = existsSync(enriched) ? enriched : raw;
  const json = JSON.parse(readFileSync(path, "utf-8"));
  return json as AnyDaily;
}

function safeMd(text: string): string {
  return text.replace(/\r\n/g, "\n").trim();
}

function formatTags(tags?: string[]): string {
  if (!tags || tags.length === 0) return "";
  return tags.map((t) => `#${t}`).join(" ");
}

function toPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 将 item.image 转为 Markdown 可引用的路径。
 * - 本地路径 assets/xxx.webp -> ../data/assets/xxx.webp（相对 exports/）
 * - 外部 URL -> 原样
 */
function imagePathForMd(image: string): string {
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }
  return `../data/${image}`;
}

function main() {
  const date = pickDateArg();
  if (!date) {
    usage();
    process.exit(1);
  }

  const daily = readDaily(date);
  const items = [...(daily.items || [])]
    .sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))
    .slice(0, MAX_EXPORT);

  const outDir = resolve(process.cwd(), "exports");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, `${date}.md`);

  let md = "";
  md += `# 今日精选（${date}）\n\n`;
  md += `> 说明：本文由 Eyes 自动聚合与整理，面向国内读者做了中文简介与重点提炼。\n\n`;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const title = item.title_zh || item.title;
    md += `## ${i + 1}. ${safeMd(title)}\n\n`;

    if (item.image) {
      md += `![配图](${imagePathForMd(item.image)})\n\n`;
    }

    const summary = item.summary_zh
      ? item.summary_zh
      : item.description
        ? toPlainText(item.description)
        : "（暂无简介）";
    md += `${safeMd(summary)}\n\n`;

    const tagsLine = formatTags(item.tags);
    if (tagsLine) {
      md += `**标签：** ${tagsLine}\n\n`;
    }

    md += `**原文：** ${item.url}\n\n`;
    md += `---\n\n`;
  }

  writeFileSync(outPath, md, "utf-8");
  console.log(`✓ 已导出：${outPath}`);
}

main().catch((err) => {
  console.error("导出失败：", err);
  process.exit(1);
});
