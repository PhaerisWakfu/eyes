#!/usr/bin/env -S npx tsx
import { cpSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const publicData = resolve(root, "public", "data");

for (const dir of ["enriched", "raw"]) {
  const src = resolve(root, "data", dir);
  if (!existsSync(src)) continue;
  const dst = resolve(publicData, dir);
  mkdirSync(dst, { recursive: true });
  for (const file of readdirSync(src)) {
    if (file.endsWith(".json")) {
      cpSync(resolve(src, file), resolve(dst, file), { overwrite: true });
    }
  }
}
console.log("[copy-data] 已复制 data 到 public/data");
