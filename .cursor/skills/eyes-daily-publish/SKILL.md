---
name: eyes-daily-publish
description: 执行 Eyes 项目的「抓取 → 增强 → 下载配图 → 导出公众号 → 发布」全流程。使用时机：用户要求跑每日发布、自动化发公众号、按 README 跑完整流程、或说「抓昨天并发布」等。
---

# Eyes 每日发布自动化流程

按 README 与 AGENT_PLAYBOOK 执行从抓取到公众号发布的完整流水线。**日期约定**：全程使用「昨天」的日期 `YYYY-MM-DD`（与 `npm run fetch` 默认行为一致）。

## 前置条件

- 项目根目录为 `eyes`，已执行过 `npm install`。
- 发布到公众号时需已启用 **user-wenyan-mcp**，且具备 `publish_article` 工具。

## 流程步骤（按序执行）

### 1. 计算「昨天」日期

使用当前日期减一天，得到 `YYYY-MM-DD`（如 `2026-03-11`）。后续步骤均使用该日期变量 `DATE`。

### 2. 抓取昨日数据

在项目根目录执行：

```bash
npm run fetch
```

- 会抓取**前一天**的数据并写入 `data/raw/{DATE}.json`。
- 若需指定日期可执行：`npm run fetch 2026-03-10`（本流程中统一用「昨天」即可）。

### 3. 按 AGENT_PLAYBOOK 做增量增强（必须由 Agent 完成）

对 `data/raw/{DATE}.json` 按 **AGENT_PLAYBOOK.md** 执行增强，输出到 `data/enriched/{DATE}.json`。

**重要**：`data/enriched/{DATE}.json` **必须由 Agent 基于自身能力生成**，包括对每条内容的理解、价值判断、中文简介撰写、标签选择、点评与配图建议等；**不得使用固定规则或脚本**批量生成，否则无法保证分析质量与点评人味。

执行要点：

1. **阶段 A**：对当日 `items` **全部条目**逐条分析并打 `valueScore`（1–10），不写简介/翻译/配图/标签。
2. **阶段 B**：按 `valueScore` 降序取 **Top20**，仅对 Top20 逐条生成 `summary_zh`、`title_zh`、`tags`、`image`、`insight`、`commentary` 等完整字段（需结合原文理解与 AGENT_PLAYBOOK 的标签体系、点评要求）。
3. 将增强后的 **Top20** 写入 `data/enriched/{DATE}.json`，保留 `date`、`fetchedAt`、`enrichedAt` 等元数据。

详细字段要求、标签体系、质量要求见 [AGENT_PLAYBOOK.md](../../../AGENT_PLAYBOOK.md)。

### 4. 下载配图

在项目根目录执行：

```bash
npm run download-images -- {DATE}
```

- 将 enriched 中的 `image` URL（或从原文 og:image）下载到 `data/assets/{DATE}/`，并更新为本地路径。
- 导出公众号 Markdown 时会引用这些本地路径。

### 5. 导出公众号 Markdown（必须等待配图下载完成）

等待第四步所有配图下载完成后，在项目根目录执行（传入日期以与前面步骤一致）：

```bash
npm run wechat -- {DATE}
```

- 生成文件：`exports/{DATE}.md`，图片引用 `data/assets/{DATE}/` 下的本地路径。

### 6. 调用 wenyan-mcp 发布到公众号

1. **先查看 MCP 工具 schema**：在 `mcps/user-wenyan-mcp/tools/` 下找到 `publish_article` 的 JSON 描述，确认参数名、类型、是否必填。
2. **读取导出的 Markdown**：读取 `exports/{DATE}.md` 的完整内容作为正文。
3. **调用 MCP 工具**：使用 `call_mcp_tool`，server 为 `user-wenyan-mcp`，toolName 为 `publish_article`，传入：
   - 正文内容（来自 `exports/{DATE}.md`）；
   - 主题：默认**phycat**（按用户要求）；
   - 其他参数按 schema 填写（如标题可取自日期或「Eyes 日报 {DATE}」等）。

若 MCP 要求标题、摘要等，可由 Agent 根据 `exports/{DATE}.md` 或 `data/enriched/{DATE}.json` 生成简短标题/摘要。

## 检查清单（执行后自检）

- [ ] `data/raw/{DATE}.json` 已存在且含当日 items
- [ ] `data/enriched/{DATE}.json` 已存在且仅含 Top20，含 `valueScore`、`summary_zh`、`tags`、`commentary` 等
- [ ] `data/assets/{DATE}/` 下已有配图（若 enriched 中填了 image）
- [ ] `exports/{DATE}.md` 已生成且图片路径正确
- [ ] wenyan-mcp `publish_article` 已使用正确主题标识成功发布

## 注意事项

- **Enriched 必须由 Agent 生成**：Step 3 的 `data/enriched/{DATE}.json` 需依赖 Agent 的分析、点评、打标签等能力逐条生成，不得用固定脚本或规则批量产出，以保证简介深度、标签准确与点评质量。

## 常见问题

- **wechat 导出无图**：先确保执行了 Step 4 `npm run download-images`，且 enriched 中 Top20 的 `image` 已填或脚本能从原文抓 og:image。
- **发布失败**：确认 user-wenyan-mcp 已启用，且 `publish_article` 的必填参数（如正文、主题）均已传入；标题/摘要按 schema 要求补全。

## 相关文件

- 项目说明与命令一览：[README.md](../../../README.md)
- 增强规则与两阶段流程：[AGENT_PLAYBOOK.md](../../../AGENT_PLAYBOOK.md)
- 导出脚本：`scripts/wechat-export.ts`（默认昨天；传参 `-- {DATE}` 指定日期）
