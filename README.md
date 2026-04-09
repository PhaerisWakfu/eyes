# Eyes — 技术洞察与商业模式聚合

从多源聚合科技与商业相关内容，面向国内用户；**公众号导出**优先使用 **enriched**（中文简介、标签、价值分等），无 enriched 时回退 **raw**。

## 关注公众号，查看发布效果

日报等内容会同步发布到微信公众号。可**扫描下方二维码关注**，在公众号内查看**实际推送与排版效果**（与 `npm run wechat` 导出、Agent 发布流程对应）。

![微信公众号二维码](./wechat.jpg)

**抓取侧实际接入的数据源**（见 `scripts/fetch.ts` 与各 `scripts/sources/*`）：

| 类型 | 来源 |
|------|------|
| 榜单 / 社区 | Hacker News、Lobsters、GitHub Trending、Product Hunt、DEV.to |
| RSS | Changelog News、arXiv（`cs.AI` + `cs.LG`）、Hugging Face Papers（`papers.takara.ai` 聚合） |

抓取结果会经 `scripts/filter.ts` 按「科技 / 技术 / AI / 商业模式」过滤，并与 **过去 7 天** 内已出现在 `data/raw`、`data/enriched` 中的 URL 去重（`DEDUPE_DAYS = 7`）。Product Hunt 可设环境变量 `PH_TOKEN` 走官方 API；未设置时会尝试网页兜底（可能不稳定）。

## 许可证与合规（开源）

- **许可证**：[MIT](./LICENSE)。
- **`data/` 内容**：`raw` 为公开来源的链接与摘要等元数据，版权归原作者与各数据源；`enriched` 中的中文简介、点评等多为 **AI 辅助生成**，不代表原文立场，亦**不是**版权方授权的官方版本。本地使用与再分发时请自行评估是否符合适用法律与各站点服务条款。
- **环境变量**：复制 [`.env.example`](./.env.example) 为 `.env`（勿提交）。`WECHAT_MD_AUTHOR` 控制公众号导出 Markdown 的 `author`、随机引言与点评前缀，默认「啾伯特」。
- **参与与安全**：[CONTRIBUTING.md](./CONTRIBUTING.md)、[SECURITY.md](./SECURITY.md)。

## 项目怎么跑起来（推荐方式）

**日常主线**：在 Cursor 等 IDE 里用 **Agent** 调用项目自带的 **Skills**（例如 `.cursor/skills/eyes-daily-publish/`），串联「抓取 → 按 `AGENT_PLAYBOOK.md` 增强 → 下载配图 → 导出公众号 Markdown →（可选）通过 MCP 发布到微信公众号」。这样不必死记每一步命令，由 Agent 按技能说明执行。

**数据目录**：`data/` 默认在 **`.gitignore`** 中，抓取与增强结果只保留在本机，用于去重与导出；克隆仓库后需自行 `npm run fetch` 生成 `data/raw/` 等。

仍可直接用终端跑 `npm run fetch` 等命令，下文保留完整命令说明，便于排查或与 Agent 流程对照。

### 文颜 MCP（公众号自动发布）

发布到微信公众号这一步，推荐使用开源项目 **[文颜 MCP Server](https://github.com/caol64/wenyan-mcp)**（`caol64/wenyan-mcp`）。它实现的是：**通过 MCP 把 AI 客户端（如 Cursor）与文颜排版能力连起来**——Agent 读取 Eyes 导出的 Markdown（含 `title` / `cover` / `author` 等 front matter）后，可调用文颜将内容**排版并上传至微信公众号**（常见流程是进**草稿箱**，再在后台确认发送），避免在多个编辑器之间复制粘贴。

配置要点见上游文档：需准备 **`WECHAT_APP_ID`、`WECHAT_APP_SECRET`**，并注意公众号后台 **IP 白名单**（详见 [文颜上传说明](https://yuzhi.tech/docs/wenyan/upload)）；若无固定出口 IP，可使用仓库介绍的 **Server / 远程模式**。Cursor 中 MCP 名称若配置为 `user-wenyan-mcp` 等，与本地映射一致即可；具体工具名（如 `publish_article`）以你安装的文颜 MCP 版本为准。

---

## 环境准备

需要先安装 **Node.js**（**18+**，与 `package.json` 中 `engines` 一致）：

- 官网下载：<https://nodejs.org/>
- 安装后打开终端，输入 `node -v` 和 `npm -v` 能显示版本号即表示安装成功。

---

## 第一次使用（初始化）

在项目根目录 `eyes` 下打开终端（PowerShell 或 CMD），执行：

```bash
npm install
```

会下载依赖，只需执行一次（或在你执行 `npm run fetch` 等命令报错缺少依赖时再执行）。

建议复制 **`.env.example` → `.env`**，按需填写 `PH_TOKEN`、`WECHAT_MD_AUTHOR` 等。`npm run fetch` 与 `npm run wechat` 会通过 `scripts/load-env.ts` 读取 `.env`。

---

## 日常使用流程

### 1. 抓取数据

每天（或需要更新时）执行一次，会抓取**前一天**的数据并保存到 `data/raw/`：

```bash
npm run fetch
```

- 会从各数据源拉取内容，并按「科技 / 技术 / AI / 商业模式」过滤。
- 抓取时会**排除过去 7 天内** raw/enriched 已出现的 URL，减少日间重复。
- 结果保存在 `data/raw/YYYY-MM-DD.json`（例如 `data/raw/2026-03-09.json`）。

若要抓取**指定日期**，在命令后加日期：

```bash
npm run fetch 2026-03-08
```

### 2. 可选：用 Agent 做中文增强

若希望每条有**中文简介（更深入）、标题翻译、标签、价值分**，可在 Cursor 里对 AI 说：

- 「按 AGENT_PLAYBOOK.md 增强 data/raw/2026-03-09.json」

增强后的文件会写到 `data/enriched/2026-03-09.json`，**公众号导出会优先读 enriched**。

重要说明（与现状一致）：
- `AGENT_PLAYBOOK.md` 采用**两阶段流程**：先给所有条目打 `valueScore`，再只对 **Top20** 生成完整字段（简介/翻译/标签/配图等），避免在 20 名以后浪费时间。
- `data/enriched/{date}.json` **只包含 Top20 条目**（与 `npm run wechat` 导出条数上限一致）。

### 3. 可选：下载配图到本地

配图会保存到 `data/assets/{日期}/`（按日期分文件夹）。若 enriched 里填了 `image` URL，脚本会下载；若未填，会尝试从原文页面抓取 og:image。导出前请按需执行：

```bash
npm run download-images
```

不传日期时默认处理昨天；可指定日期：`npm run download-images -- 2026-03-09`。调试时可加 `--verbose`：`npm run download-images:verbose`

### 4. 导出公众号 Markdown

```bash
npm run wechat -- 2026-03-09
```

不传日期时默认**昨天**。生成 `exports/{date}.md`；首条无合适配图时，封面使用仓库内已提交的 `static/wechat-default-cover.png`（文颜/Markdown 中为相对 `exports/` 的路径）。导出**不含** front matter 里的 `source_url`（不设置公众号「阅读原文」跳转，避免指向已下线站点）；每条正文小标题仍为指向各资讯**原文**的 Markdown 链接。

---

## 常用命令一览

| 命令 | 作用 |
|------|------|
| `npm install` | 安装依赖（首次或报错时执行） |
| `npm run fetch` | 抓取前一天数据到 `data/raw/` |
| `npm run fetch 2026-03-08` | 抓取指定日期数据 |
| `npm run download-images` | 下载配图到 `data/assets/{日期}/`，更新 enriched 中的 `image` 为本地路径；不传日期默认昨天 |
| `npm run download-images -- 2026-03-09` | 下载指定日期的配图 |
| `npm run download-images:verbose` | 同上，带详细日志 |
| `npm run wechat -- 2026-03-09` | 导出公众号 Markdown 到 `exports/2026-03-09.md`，图片引用 `data/assets/{日期}/` |

---

## 项目结构（你可能会碰到的）

```
eyes/
├── data/                 # 本地数据（默认 git 忽略）：raw / enriched / assets
│   ├── raw/              # 抓取的原始数据（按日期 .json）
│   ├── enriched/         # Agent 增强后的数据（按日期 .json，仅 Top20）
│   └── assets/           # 下载的配图，按日期分目录（如 assets/2026-03-09/）
├── static/
│   └── wechat-default-cover.png  # 公众号默认封面（随仓库提交）
├── scripts/
│   ├── load-env.ts        # 为 tsx 脚本加载根目录 .env
│   ├── fetch.ts           # 抓取脚本（含 7 天 URL 去重）
│   ├── download-images.ts # 将图片 URL 或 og:image 下载到 data/assets/{日期}/
│   └── wechat-export.ts   # 导出公众号 Markdown（最多 20 条）
├── exports/               # 导出的公众号 Markdown（如 2026-03-09.md，默认 git 忽略）
├── .cursor/skills/        # Agent Skills（如每日发布全流程）
├── wechat.jpg             # 微信公众号二维码（README 展示）
├── AGENT_PLAYBOOK.md      # 给 AI 看的增强说明
├── package.json
└── README.md
```

- **只改内容**：主要动本地 `data/raw/`、`data/enriched/` 和 `AGENT_PLAYBOOK.md`。
- **自动化发公众号**：在 IDE 中对 Agent 说明意图（或引用 `eyes-daily-publish` 技能），并确保已配置 [文颜 MCP](https://github.com/caol64/wenyan-mcp)（见上文「文颜 MCP」小节）。
- **导出公众号**：`exports/` 目录默认被 `.gitignore` 忽略，Markdown 仅在本机；需要版本管理或备份时请自行调整忽略规则。

**脚本如何读数据**：`fetch` / `download-images` / `wechat-export` 均直接读写项目根下 `data/`（导出时先 enriched，无则 raw）。

---

## 遇到问题时

1. **`npm run fetch` 报错**  
   先在项目根目录执行一次 `npm install`，再重试。

2. **`npm run wechat` 提示找不到 JSON**  
   确认 `data/raw/` 或 `data/enriched/` 下已有对应日期的 `.json`（先跑一次 `npm run fetch`，并按需增强）。

3. **想抓 Product Hunt**  
   推荐在环境变量中设置 `PH_TOKEN`（Developer Token）再执行 `npm run fetch`，接口更稳定；未设置时脚本会尝试网页兜底，可能因站点结构变化而失败（见 `scripts/sources/producthunt.ts`）。

4. **导出公众号 Markdown 没有配图**  
   配图需执行 `npm run download-images`（或带日期）下载到 `data/assets/{日期}/`；enriched 中可填 `image` URL，或脚本会尝试从原文页面抓取 og:image。部分网站没有设置或做了限制，会导出无图版本。

5. **导出的文件在哪里？**  
   - Markdown：`exports/2026-03-09.md`（**默认被 git 忽略**，见 `.gitignore`）  
   - 配图：`data/assets/2026-03-09/` 下；Markdown 内图片路径为相对 `exports/` 的 `../data/assets/...`（或仍为 `http(s)` 外链），见 `scripts/wechat-export.ts` 中 `imagePathForMd`

若主要用 Agent + Skills，可把本文当作命令与目录结构的参考手册。
