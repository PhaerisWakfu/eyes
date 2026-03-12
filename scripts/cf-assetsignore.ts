#!/usr/bin/env -S npx tsx
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const distDir = resolve(root, "dist");

if (!existsSync(distDir)) {
  console.error('[cf-assetsignore] 找不到 "dist/"，请先执行构建。');
  process.exit(1);
}

const assetsIgnorePath = resolve(distDir, ".assetsignore");
const requiredLine = "_worker.js";

const current = existsSync(assetsIgnorePath)
  ? readFileSync(assetsIgnorePath, "utf8")
  : "";

const lines = new Set(
  current
    .split(/\r?\n/g)
    .map((l) => l.trim())
    .filter(Boolean)
);

lines.add(requiredLine);

const next = Array.from(lines).join("\n") + "\n";
mkdirSync(distDir, { recursive: true });
writeFileSync(assetsIgnorePath, next, "utf8");
console.log(`[cf-assetsignore] 已写入 dist/.assetsignore（忽略 ${requiredLine}）`);

