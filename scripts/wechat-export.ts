import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

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
  console.log(
    "说明：读取 data/enriched/{date}.json（优先）或 data/raw/{date}.json，导出到 exports/wechat/{date}/{date}.md，并尝试下载配图到 exports/wechat/{date}/assets/"
  );
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

function toPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractOgImage(html: string): string | null {
  const candidates = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["'][^>]*>/i,
  ];
  for (const re of candidates) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Eyes/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function resolveImage(item: AnyItem): Promise<string | null> {
  if (item.image) return item.image;
  const html = await fetchHtml(item.url);
  if (!html) return null;
  const og = extractOgImage(html);
  if (!og) return null;
  try {
    return new URL(og, item.url).toString();
  } catch {
    return og;
  }
}

function guessExt(url: string, contentType?: string | null): string {
  const ct = (contentType || "").toLowerCase();
  if (ct.includes("image/png")) return "png";
  if (ct.includes("image/webp")) return "webp";
  if (ct.includes("image/gif")) return "gif";
  if (ct.includes("image/jpeg") || ct.includes("image/jpg")) return "jpg";
  if (ct.includes("image/svg")) return "svg";

  try {
    const u = new URL(url);
    const last = u.pathname.split("/").pop() || "";
    const m = last.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i);
    if (m?.[1]) return m[1].toLowerCase().replace("jpeg", "jpg");
  } catch {
    // ignore
  }
  return "jpg";
}

async function downloadImageToLocal(imgUrl: string, outDir: string): Promise<string | null> {
  try {
    const res = await fetch(imgUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Eyes/1.0)", Accept: "image/*,*/*;q=0.8" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type");
    const ext = guessExt(imgUrl, ct);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 1024) return null;

    const hash = createHash("sha1").update(buf).digest("hex").slice(0, 10);
    const filename = `${hash}.${ext}`;
    const absPath = resolve(outDir, filename);
    writeFileSync(absPath, buf);
    return filename;
  } catch {
    return null;
  }
}

function safeMd(text: string): string {
  return text.replace(/\r\n/g, "\n").trim();
}

function formatTags(tags?: string[]): string {
  if (!tags || tags.length === 0) return "";
  return tags.map((t) => `#${t}`).join(" ");
}

async function main() {
  const date = pickDateArg();
  if (!date) {
    usage();
    process.exit(1);
  }

  const daily = readDaily(date);
  const items = [...(daily.items || [])].sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0)).slice(0, MAX_EXPORT);

  const outDir = resolve(process.cwd(), "exports", "wechat", date);
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, `${date}.md`);
  const assetsDir = resolve(outDir, "assets");
  mkdirSync(assetsDir, { recursive: true });

  let md = "";
  md += `# 今日精选（${date}）\n\n`;
  md += `> 说明：本文由 Eyes 自动聚合与整理，面向国内读者做了中文简介与重点提炼。\n\n`;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const title = item.title_zh || item.title;
    md += `## ${i + 1}. ${safeMd(title)}\n\n`;

    const imgUrl = await resolveImage(item);
    if (imgUrl) {
      const localName = await downloadImageToLocal(imgUrl, assetsDir);
      if (localName) {
        md += `![配图](./assets/${localName})\n\n`;
      }
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

