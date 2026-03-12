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
  commentary?: string;
};

type AnyDaily = {
  date: string;
  fetchedAt: string;
  enrichedAt?: string;
  items: AnyItem[];
};

const MAX_EXPORT = 20;

function usage() {
  console.log("用法：npm run wechat [日期]");
  console.log("      不传日期时默认导出昨天，如：npm run wechat -- 2026-03-09");
  console.log("说明：读取 data/enriched 或 data/raw，导出 Markdown 到 exports/{date}.md，图片引用 data/assets/");
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function pickDateArg(): string | null {
  const arg = process.argv[2];
  if (!arg) return yesterday();
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

/** 标题中的 ] 需转义，否则会破坏 Markdown 链接 */
function escapeLinkText(text: string): string {
  return text.replace(/\]/g, "\\]");
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
 * 是否为 webp 格式（微信不支持，导出时不配图）
 */
function isWebp(image: string): boolean {
  const lower = image.toLowerCase();
  return lower.endsWith(".webp") || lower.includes(".webp?");
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
  console.log(`导出日期：${date}`);

  const daily = readDaily(date);
  const items = [...(daily.items || [])]
    .sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))
    .slice(0, MAX_EXPORT);

  const outDir = resolve(process.cwd(), "exports");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, `${date}.md`);

  const firstWithImage = items.find((it) => it.image && !isWebp(it.image));
  const frontMatterTitle = firstWithImage
    ? (firstWithImage.title_zh || firstWithImage.title)
    : items[0]
      ? (items[0].title_zh || items[0].title)
      : `昨日旧闻（${date}）`;
  const frontMatterCover = firstWithImage
    ? imagePathForMd(firstWithImage.image!)
    : "";

  function yamlEscape(s: string): string {
    return s.replace(/"/g, '\\"');
  }
  let md = "";
  md += "---\n";
  md += `title: "${yamlEscape(safeMd(frontMatterTitle))}"\n`;
  md += frontMatterCover ? `cover: ${frontMatterCover}\n` : "";
  md += "author: 啾伯特\n";
  md += "source_url: https://eyes.phaeris.xyz\n";
  md += "---\n\n";
  md += `# 昨日旧闻（${date}）\n\n`;
  md += `> 拒绝信息过载，洞悉技术趋势。\n\n`;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const title = item.title_zh || item.title;
    md += `## ${i + 1}. [${escapeLinkText(safeMd(title))}](${item.url})\n\n`;

    if (item.image && !isWebp(item.image)) {
      md += `![配图](${imagePathForMd(item.image)})\n\n`;
    }

    const summary = item.summary_zh
      ? item.summary_zh
      : item.description
        ? toPlainText(item.description)
        : "（暂无简介）";
    md += `${safeMd(summary)}\n\n`;

    if (item.commentary) {
      md += `**点评：** ${safeMd(item.commentary)}\n\n`;
    }

    md += `---\n\n`;
  }

  writeFileSync(outPath, md, "utf-8");
  console.log(`✓ 已导出：${outPath}`);
}

try {
  main();
} catch (err) {
  console.error("导出失败：", err);
  process.exit(1);
}
