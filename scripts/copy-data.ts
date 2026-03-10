#!/usr/bin/env -S npx tsx
import { cpSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const publicData = resolve(root, "public", "data");

let hasAnyData = false;

for (const dir of ["enriched", "raw"]) {
  const src = resolve(root, "data", dir);
  if (!existsSync(src)) continue;
  const dst = resolve(publicData, dir);
  mkdirSync(dst, { recursive: true });
  for (const file of readdirSync(src)) {
    if (file.endsWith(".json")) {
      cpSync(resolve(src, file), resolve(dst, file), { overwrite: true });
      hasAnyData = true;
    }
  }
}

const assetsSrc = resolve(root, "data", "assets");
if (existsSync(assetsSrc)) {
  const assetsDst = resolve(publicData, "assets");
  mkdirSync(assetsDst, { recursive: true });
  cpSync(assetsSrc, assetsDst, { recursive: true });
}

if (!hasAnyData) {
  console.error(
    "[copy-data] 错误：data/enriched/ 或 data/raw/ 下没有 .json 文件。\n" +
      "  构建时 SSR 需要读取这些数据，否则页面会白屏。\n" +
      "  请先执行 npm run fetch 并提交 data/ 目录，或检查 .dockerignore 是否排除了 data/。"
  );
  process.exit(1);
}

console.log("[copy-data] 已复制 data（含 assets）到 public/data");
