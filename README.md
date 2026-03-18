# Eyes — 技术洞察与商业模式聚合

从 Hacker News、Lobsters、GitHub Trending、DEV.to、Changelog、arXiv、论文聚合等来源聚合科技与商业相关内容，面向国内用户，支持中文简介与标签。

---

## 环境准备

需要先安装 **Node.js**（建议 18 或以上）：

- 官网下载：<https://nodejs.org/>
- 安装后打开终端，输入 `node -v` 和 `npm -v` 能显示版本号即表示安装成功。

---

## 第一次使用（初始化）

在项目根目录 `eyes` 下打开终端（PowerShell 或 CMD），执行：

```bash
npm install
```

会下载依赖，只需执行一次（或在你执行 `npm run fetch` / `npm run dev` 报错缺少依赖时再执行）。

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

用浏览器打开 **http://localhost:4321/** 即可：

- 首页默认显示 **T-1（昨天）** 的日报，刷新即按当天时间重新计算；
- 顶栏日期可切换 T-1 / T-2 / T-3 查看。

关掉网站：在运行 `npm run dev` 的终端里按 `Ctrl + C`。

### 4. 可选：下载配图到本地

配图会保存到 `data/assets/{日期}/`（按日期分文件夹）。若 enriched 里填了 `image` URL，脚本会下载；若未填，会尝试从原文页面抓取 og:image。**构建时不会自动下载**，仅复制 `data/assets` 中已有图片；需在构建前手动执行：

```bash
npm run download-images
```

不传日期时默认处理昨天；可指定日期：`npm run download-images -- 2026-03-09`。调试时可加 `--verbose`：`npm run download-images:verbose`

### 5. 打包成静态网站（用于部署）

不依赖 Node 的「成品」网站会生成到 `dist/` 目录：

```bash
npm run build
```

构建时依次执行：`copy-data`（复制 data 含 assets 到 public）→ `astro build`。配图需提前运行 `npm run download-images`。

生成完成后，可在本地先预览打包结果：

```bash
npm run preview
```

再在浏览器打开终端里提示的地址（一般是 http://localhost:4321/）。

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
| `npm run build` | 打包成静态站到 `dist/` |
| `npm run preview` | 预览打包后的网站 |

---

## 项目结构（你可能会碰到的）

```
eyes/
├── data/
│   ├── raw/           # 抓取的原始数据（按日期 .json）
│   ├── enriched/     # Agent 增强后的数据（按日期 .json，仅 Top20）
│   └── assets/       # 下载的配图，按日期分目录（如 assets/2026-03-09/）
├── scripts/
│   ├── fetch.ts           # 抓取脚本（含 7 天 URL 去重）
│   ├── copy-data.ts       # 将 data/ 复制到 public/data（build/dev 时自动执行）
│   ├── download-images.ts # 将图片 URL 或 og:image 下载到 data/assets/{日期}/
│   └── wechat-export.ts   # 导出公众号 Markdown 到 exports/{date}.md
├── src/               # 前端页面与组件（Astro）
├── exports/           # 导出的公众号 Markdown（如 2026-03-09.md）
├── public/            # 静态资源；build 时会将 data 复制到 public/data
├── AGENT_PLAYBOOK.md  # 给 AI 看的增强说明
├── package.json      # 依赖与脚本定义
└── README.md         # 本说明
```

- **只改内容**：主要动 `data/raw/`、`data/enriched/` 和 `AGENT_PLAYBOOK.md` 即可。
- **改网站样式或排版**：在 `src/` 里改（不熟前端可先不动）。

---

## 部署到网上（可选）

把项目推到 GitHub 后，可免费部署到：

- **Vercel**：<https://vercel.com> — 连 GitHub 仓库，选本项目，用默认设置即可，构建命令填 `npm run build`，输出目录填 `dist`。
- **Netlify**：<https://netlify.com> — 同样连仓库，Build command: `npm run build`，Publish directory: `dist`。

部署完成后，每次推送 `data/enriched/` 或代码，会自动重新构建并更新网站。

---

## 遇到问题时

1. **`npm run fetch` 或 `npm run dev` 报错**  
   先在项目根目录执行一次 `npm install`，再重试。

2. **打开 http://localhost:4321 没内容或报错**  
   确认 `data/raw/` 或 `data/enriched/` 下至少有对应日期的 `.json` 文件（先跑一次 `npm run fetch`）。

3. **想抓 Product Hunt**  
   需在 Product Hunt 申请 Developer Token，在环境变量里设置 `PH_TOKEN=你的token` 后再执行 `npm run fetch`。

4. **导出公众号 Markdown 没有配图**  
   配图需在构建前手动执行 `npm run download-images`（或带日期 `npm run download-images -- 2026-03-09`）下载到 `data/assets/{日期}/`；enriched 中可填 `image` URL，或脚本会尝试从原文页面抓取 og:image。部分网站没有设置或做了限制，会导出无图版本。

5. **导出的文件在哪里？**  
   - Markdown：`exports/2026-03-09.md`  
   - 配图：`data/assets/2026-03-09/` 下，Markdown 中引用 `../data/assets/2026-03-09/xxx.jpg`

6. **部署后白屏**  
   - 构建时 SSR 需要读取 `data/enriched/` 或 `data/raw/` 下的 `.json`，否则页面只显示「加载中…」或空白。  
   - 确保 `data/` 已提交到 git（`.gitignore` 只排除 `public/data/`，不排除 `data/`）。  
   - 若使用 Docker 构建，`.dockerignore` 已配置为**不排除** `data/`；若自定义了 `.dockerignore`，务必保留 `data/`。  
   - 首次部署前至少执行一次 `npm run fetch` 并提交 `data/raw/` 中的文件。

以上步骤足够完成「抓数据 → 可选增强 → 本地看站 → 打包/部署」全流程；不熟悉前端也只需按顺序执行命令即可。
