# Eyes — 技术洞察与商业模式聚合

从多源聚合科技与商业相关内容，面向国内用户；站点侧优先展示 **enriched**（中文简介、标签、价值分等），无 enriched 时回退 **raw**。

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
- **`data/` 内容**：`raw` 为公开来源的链接与摘要等元数据，版权归原作者与各数据源；`enriched` 中的中文简介、点评等多为 **AI 辅助生成**，不代表原文立场，亦**不是**版权方授权的官方版本。Fork 或再分发时请自行评估是否符合适用法律与各站点服务条款。
- **环境变量**：复制 [`.env.example`](./.env.example) 为 `.env`（勿提交）。`PUBLIC_SITE_URL` 会用于 Astro 的 `site` 与公众号导出里的 `source_url`；不设时默认仍为 `https://eyes.phaeris.xyz`，**Fork 部署请务必改成你的域名**。`WECHAT_MD_AUTHOR` 控制公众号导出 Markdown 的 `author`、随机引言与点评前缀，默认「啾伯特」。
- **参与与安全**：[CONTRIBUTING.md](./CONTRIBUTING.md)、[SECURITY.md](./SECURITY.md)。

## 项目怎么跑起来（推荐方式）

**日常主线**：在 Cursor 等 IDE 里用 **Agent** 调用项目自带的 **Skills**（例如 `.cursor/skills/eyes-daily-publish/`），串联「抓取 → 按 `AGENT_PLAYBOOK.md` 增强 → 下载配图 → 导出公众号 Markdown →（可选）通过 MCP 发布到微信公众号」。这样不必死记每一步命令，由 Agent 按技能说明执行。

**网站发布**：前端为 **Astro 5**（`output: "server"`），通过 **`@astrojs/cloudflare`** 与 **Wrangler** 部署；生产站点 URL 由环境变量 **`PUBLIC_SITE_URL`** 提供（与 `.env` / 托管平台环境变量一致），未设置时默认 `https://eyes.phaeris.xyz`。**推送代码到远程仓库后**，一般由 Cloudflare 关联仓库自动构建并发布；本地也可 `npm run deploy`。详见下文「部署」一节。

仍可直接用终端跑 `npm run fetch` 等命令，下文保留完整命令说明，便于排查或与 Agent 流程对照。

### 文颜 MCP（公众号自动发布）

发布到微信公众号这一步，推荐使用开源项目 **[文颜 MCP Server](https://github.com/caol64/wenyan-mcp)**（`caol64/wenyan-mcp`）。它实现的是：**通过 MCP 把 AI 客户端（如 Cursor）与文颜排版能力连起来**——Agent 读取 Eyes 导出的 Markdown（含 `title` / `cover` / `author` / `source_url` 等 front matter）后，可调用文颜将内容**排版并上传至微信公众号**（常见流程是进**草稿箱**，再在后台确认发送），避免在多个编辑器之间复制粘贴。

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

会下载依赖，只需执行一次（或在你执行 `npm run fetch` / `npm run dev` 报错缺少依赖时再执行）。

建议复制 **`.env.example` → `.env`**，填写自己的 `PUBLIC_SITE_URL`（及可选的 `PH_TOKEN`、`WECHAT_MD_AUTHOR`）。`npm run fetch` 与 `npm run wechat` 会通过 `scripts/load-env.ts` 读取 `.env`；`astro dev` / `astro build` 由框架加载同名变量。

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

增强后的文件会写到 `data/enriched/2026-03-09.json`，前端会优先读这里的数据。

重要说明（与现状一致）：
- `AGENT_PLAYBOOK.md` 采用**两阶段流程**：先给所有条目打 `valueScore`，再只对 **Top20** 生成完整字段（简介/翻译/标签/配图等），避免在 20 名以后浪费时间。
- `data/enriched/{date}.json` **只包含 Top20 条目**（页面展示也是 Top20）。

### 3. 本地看网站（开发模式）

在项目根目录执行：

```bash
npm run dev
```

终端会显示类似：

```
  Local:   http://localhost:4321/
```

用浏览器打开 **http://localhost:4321/** 即可。

**首页日期逻辑**（与 `src/pages/index.astro`、`src/lib/data.ts` 一致）：

- **首屏 SSR**：构建或 `dev` 时，服务端用 `getLatestDate()` 取 `data/raw` 与 `data/enriched` 下所有 `YYYY-MM-DD.json` 中**日期最新**的一份渲染列表（最多 20 条，按 `valueScore` 降序，无分则保持原顺序后截断）。
- **浏览器加载后**：内联脚本会以**自然日的「昨天」**为默认日期，请求 `/data/enriched/{date}.json`，失败再试 `/data/raw/{date}.json`；顶栏可在**昨天、前天、大前天**三天间切换（`RECENT_DAYS = 3`）。因此若仓库里「最新文件日期」与「日历昨天」不一致，可能出现首屏与脚本切换后的内容短暂不一致，刷新后以当前脚本逻辑为准。

关掉网站：在运行 `npm run dev` 的终端里按 `Ctrl + C`。

### 4. 可选：下载配图到本地

配图会保存到 `data/assets/{日期}/`（按日期分文件夹）。若 enriched 里填了 `image` URL，脚本会下载；若未填，会尝试从原文页面抓取 og:image。**构建时不会自动下载**，仅复制 `data/assets` 中已有图片；需在构建前手动执行：

```bash
npm run download-images
```

不传日期时默认处理昨天；可指定日期：`npm run download-images -- 2026-03-09`。调试时可加 `--verbose`：`npm run download-images:verbose`

### 5. 构建（用于部署）

```bash
npm run build
```

构建链路（见 `package.json`）：

1. **`copy-data`**（`scripts/copy-data.ts`）：把 `data/enriched`、`data/raw` 下的 `.json` 以及 `data/assets` 整棵复制到 `public/data/`。若 `enriched` 与 `raw` 中**没有任何** `.json`，脚本会**直接退出并报错**（避免部署后白屏）。
2. **`astro build`**：当前为 **SSR + Cloudflare 适配器**，产物在 `dist/`，供 Wrangler / Cloudflare 使用，**不是**「纯静态 HTML 导出」。
3. **`postbuild`**：自动执行 `scripts/cf-assetsignore.ts`，在 `dist/.assetsignore` 中确保忽略 `_worker.js`，避免被当作静态资源错误上传（与 Cloudflare 资源管线相关）。

配图需提前运行 `npm run download-images`；构建只会复制已有文件，不会代拉图片。

本地预览：

- `npm run preview`：Astro 自带预览（与当前 adapter 行为以官方文档为准）。
- `npm run preview:cf`：先完整 `build` 再 `wrangler dev`，更接近线上 Cloudflare 环境。

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
| `npm run dev` | 启动本地开发服务器（会先复制 data 到 public） |
| `npm run build` | `copy-data` → `astro build` → `postbuild`（`cf-assetsignore`），输出到 `dist/` |
| `npm run preview` | Astro 预览构建结果 |
| `npm run copy-data` | 仅同步 `data/` → `public/data/`（`dev`/`build` 已会自动跑） |
| `npm run preview:cf` | 本地构建后用 Wrangler 模拟 Cloudflare 环境 |
| `npm run deploy` | 构建后 `wrangler deploy`，发布到已绑定的 Cloudflare 项目 |

---

## 项目结构（你可能会碰到的）

```
eyes/
├── data/
│   ├── raw/           # 抓取的原始数据（按日期 .json）
│   ├── enriched/     # Agent 增强后的数据（按日期 .json，仅 Top20）
│   └── assets/       # 下载的配图，按日期分目录（如 assets/2026-03-09/）
├── scripts/
│   ├── load-env.ts        # 为 tsx 脚本加载根目录 .env
│   ├── fetch.ts           # 抓取脚本（含 7 天 URL 去重）
│   ├── copy-data.ts       # 将 data/ 复制到 public/data（build/dev 时自动执行）
│   ├── download-images.ts # 将图片 URL 或 og:image 下载到 data/assets/{日期}/
│   ├── wechat-export.ts   # 导出公众号 Markdown（最多 20 条，与页面 Top20 一致）
│   └── cf-assetsignore.ts # postbuild：写入 dist/.assetsignore（Cloudflare）
├── src/               # 前端页面与组件（Astro）
├── exports/           # 导出的公众号 Markdown（如 2026-03-09.md）
├── public/            # 静态资源；`public/data/` 由 copy-data 生成且已在 .gitignore 中忽略
├── .cursor/skills/    # Agent Skills（如每日发布全流程）
├── wechat.jpg         # 微信公众号二维码（README 展示，便于关注查看发布效果）
├── AGENT_PLAYBOOK.md  # 给 AI 看的增强说明
├── package.json      # 依赖与脚本定义
└── README.md         # 本说明
```

- **只改内容**：主要动 `data/raw/`、`data/enriched/` 和 `AGENT_PLAYBOOK.md` 即可。
- **自动化发公众号**：在 IDE 中对 Agent 说明意图（或引用 `eyes-daily-publish` 技能），并确保已配置 [文颜 MCP](https://github.com/caol64/wenyan-mcp)（见上文「文颜 MCP」小节）。
- **改网站样式或排版**：在 `src/` 里改（不熟前端可先不动）。
- **导出公众号**：`exports/` 目录默认被 `.gitignore` 忽略，Markdown 仅在本机；需要版本管理或备份时请自行调整忽略规则。

**运行时如何读到数据**：构建与 `astro dev` 都会先把 JSON 拷到 `public/data/`，页面脚本通过 `/data/enriched|raw/...` 拉取；`src/lib/data.ts` 中的 `getDailyData` / `getLatestDate` 等在 Node 侧直接读项目根下 `data/`（先 enriched，无则 raw）。

---

## 部署到网上（可选）

**Cloudflare（与本仓库配置一致）**

- 当前为 **Astro + `@astrojs/cloudflare` + `output: "server"`**，部署目标应为 **Cloudflare Workers 或 Pages（Workers 运行时）**，构建命令使用 **`npm run build`**（包含 `copy-data` 与 `cf-assetsignore`）。具体与仓库的连接方式、环境变量、Wrangler 项目名等以你在 [Cloudflare Dashboard](https://dash.cloudflare.com/) 中的设置为准；仓库根目录若未提交 `wrangler.toml`，多为在云端或使用 `wrangler` 默认探测，本地 `npm run deploy` 前需已完成 `wrangler login` 等与账号绑定操作。
- 推送绑定分支后，由 Cloudflare 自动构建并发布。
- 本地：`npm run deploy`、`npm run preview:cf`。

**其他平台（需改配置）**

- 当前默认 **Cloudflare adapter**，产物与 **Vercel / Netlify 的纯静态 `dist` 托管**不一定兼容。若要在其他平台部署，需在 `astro.config.mjs` 中改用对应官方 adapter 或改为静态预渲染策略，并自行调整构建命令与发布目录。
- 参考：<https://vercel.com>、<https://netlify.com>（仅作通用文档链接，非本仓库开箱配置）。

---


## 遇到问题时

1. **`npm run fetch` 或 `npm run dev` 报错**  
   先在项目根目录执行一次 `npm install`，再重试。

2. **打开 http://localhost:4321 没内容或报错**  
   确认 `data/raw/` 或 `data/enriched/` 下至少有对应日期的 `.json` 文件（先跑一次 `npm run fetch`）。

3. **想抓 Product Hunt**  
   推荐在环境变量中设置 `PH_TOKEN`（Developer Token）再执行 `npm run fetch`，接口更稳定；未设置时脚本会尝试网页兜底，可能因站点结构变化而失败（见 `scripts/sources/producthunt.ts`）。

4. **导出公众号 Markdown 没有配图**  
   配图需在构建前手动执行 `npm run download-images`（或带日期 `npm run download-images -- 2026-03-09`）下载到 `data/assets/{日期}/`；enriched 中可填 `image` URL，或脚本会尝试从原文页面抓取 og:image。部分网站没有设置或做了限制，会导出无图版本。

5. **导出的文件在哪里？**  
   - Markdown：`exports/2026-03-09.md`（**默认被 git 忽略**，见 `.gitignore`）  
   - 配图：`data/assets/2026-03-09/` 下；Markdown 内图片路径为相对 `exports/` 的 `../data/assets/...`（或仍为 `http(s)` 外链），见 `scripts/wechat-export.ts` 中 `imagePathForMd`

6. **`npm run build` 在 copy-data 步骤失败**  
   终端若出现「`data/enriched/` 或 `data/raw/` 下没有 .json 文件」，说明尚未抓取或 `data/` 未同步到构建环境；先本地 `npm run fetch`（并增强若需要），确保至少有一份日期 JSON 再构建。

7. **部署后白屏**  
   - 构建与线上都需要能通过 `copy-data` 得到 `public/data/` 下的 JSON，且运行时 `data/` 在构建机可读（与 `src/lib/data.ts` 读盘一致）。  
   - 确保 `data/*.json` 已提交到 git（`.gitignore` 只排除 `public/data/`，不排除 `data/`）。  
   - 若使用 Docker 构建，请确认镜像内包含 `data/`。仓库内 `.dockerignore` 已排除 `exports` 等但**未**排除 `data/`；若你改过该文件，勿把 `data/` 加进忽略列表。  
   - 首次部署前至少执行一次 `npm run fetch` 并提交 `data/raw/` 中的文件。

以上步骤足够完成「抓数据 → 可选增强 → 本地看站 → 打包/部署」全流程；不熟悉前端也只需按顺序执行命令即可。若主要用 Agent + Skills，可把本文当作命令与目录结构的参考手册。
