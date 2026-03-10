#!/usr/bin/env -S npx tsx
/**
 * 读取 enriched JSON，将 item.image（URL）下载到 data/assets/，
 * 并将 image 字段更新为本地路径 assets/{hash}.{ext}
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, renameSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

type AnyItem = {
  id: string;
  url: string;
  image?: string;
  [k: string]: unknown;
};

type AnyDaily = { date: string; items: AnyItem[]; [k: string]: unknown };

const ROOT = resolve(process.cwd());
const ASSETS_DIR = resolve(ROOT, "data", "assets");
const ENRICHED_DIR = resolve(ROOT, "data", "enriched");
const VERBOSE = process.argv.includes("--verbose") || process.argv.includes("-v");

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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
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
  } catch {}
  return "jpg";
}

function isLocalPath(s: string): boolean {
  return !s.startsWith("http://") && !s.startsWith("https://");
}

async function downloadToAssets(imgUrl: string, date: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(imgUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/*,*/*;q=0.8",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 100) return null;

    const ext = guessExt(imgUrl, res.headers.get("content-type"));
    const hash = createHash("sha1").update(buf).digest("hex").slice(0, 10);
    const filename = `${hash}.${ext}`;
    const dateDir = resolve(ASSETS_DIR, date);
    const outPath = resolve(dateDir, filename);

    if (existsSync(outPath)) return `assets/${date}/${filename}`;

    mkdirSync(dateDir, { recursive: true });
    writeFileSync(outPath, buf);
    return `assets/${date}/${filename}`;
  } catch {
    return null;
  }
}

async function resolveImageUrl(item: AnyItem): Promise<string | null> {
  if (item.image) {
    if (isLocalPath(item.image)) return null;
    return item.image;
  }
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

function migrateOldAssets() {
  if (!existsSync(ASSETS_DIR)) return;
  const topFiles = readdirSync(ASSETS_DIR, { withFileTypes: true });
  const enrichedFiles = readdirSync(ENRICHED_DIR).filter((f) => f.endsWith(".json"));
  for (const ent of topFiles) {
    if (!ent.isFile()) continue;
    const name = ent.name;
    for (const file of enrichedFiles) {
      const date = file.replace(".json", "");
      const path = resolve(ENRICHED_DIR, file);
      const daily: AnyDaily = JSON.parse(readFileSync(path, "utf-8"));
      const need = (daily.items || []).some(
        (it) => it.image === `assets/${name}`
      );
      if (!need) continue;
      const dateDir = resolve(ASSETS_DIR, date);
      const src = resolve(ASSETS_DIR, name);
      const dst = resolve(dateDir, name);
      if (existsSync(dst)) continue;
      mkdirSync(dateDir, { recursive: true });
      renameSync(src, dst);
      for (const it of daily.items || []) {
        if (it.image === `assets/${name}`) it.image = `assets/${date}/${name}`;
      }
      writeFileSync(path, JSON.stringify(daily, null, 2), "utf-8");
      console.log(`[download-images] 迁移 ${name} -> assets/${date}/`);
      break;
    }
  }
}

async function main() {
  if (!existsSync(ENRICHED_DIR)) {
    console.log("[download-images] 无 data/enriched 目录，跳过");
    return;
  }

  mkdirSync(ASSETS_DIR, { recursive: true });
  migrateOldAssets();
  const files = readdirSync(ENRICHED_DIR).filter((f) => f.endsWith(".json"));
  let totalDownloaded = 0;

  for (const file of files) {
    const date = file.replace(".json", "");
    const path = resolve(ENRICHED_DIR, file);
    const daily: AnyDaily = JSON.parse(readFileSync(path, "utf-8"));
    let changed = false;
    let downloaded = 0;

    for (let i = 0; i < (daily.items || []).length; i++) {
      const item = daily.items![i];
      if (item.image && isLocalPath(item.image)) continue;

      const imgUrl = await resolveImageUrl(item);
      if (!imgUrl) {
        if (VERBOSE) console.log(`  跳过 ${item.id}: 无配图`);
        continue;
      }

      const local = await downloadToAssets(imgUrl, date);
      if (local) {
        item.image = local;
        changed = true;
        downloaded++;
        totalDownloaded++;
        if (VERBOSE) console.log(`  ✓ ${item.id} -> ${local}`);
      } else if (VERBOSE) {
        console.log(`  下载失败 ${item.id}: ${imgUrl.slice(0, 60)}...`);
      }
    }

    if (changed) {
      writeFileSync(path, JSON.stringify(daily, null, 2), "utf-8");
      console.log(`[download-images] ${file}: 下载 ${downloaded} 张`);
    }
  }

  console.log(`[download-images] 完成，共 ${totalDownloaded} 张`);
}

main().catch((err) => {
  console.error("[download-images] 失败:", err);
  process.exit(1);
});
