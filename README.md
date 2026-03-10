# Eyes — 技术洞察与商业模式聚合

从 Hacker News、Lobsters、GitHub Trending、DEV.to、Changelog 等来源聚合科技与商业相关内容，面向国内用户，支持中文简介与标签。

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

- 首页会跳转到「最新有数据的那一天」；
- 地址栏可手动改成 `/day/2026-03-09` 这种格式看指定日期。

关掉网站：在运行 `npm run dev` 的终端里按 `Ctrl + C`。

### 4. 打包成静态网站（用于部署）

不依赖 Node 的「成品」网站会生成到 `dist/` 目录：

```bash
npm run build
```

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
| `npm run wechat -- 2026-03-09` | 导出公众号可复制的 Markdown（自动下载配图） |
| `npm run dev` | 启动本地开发服务器，边改边看 |
| `npm run build` | 打包成静态站到 `dist/` |
| `npm run preview` | 预览打包后的网站 |

---

## 项目结构（你可能会碰到的）

```
eyes/
├── data/
│   ├── raw/           # 抓取的原始数据（按日期 .json）
│   └── enriched/     # Agent 增强后的数据（按日期 .json，仅 Top20）
├── scripts/
│   ├── fetch.ts      # 抓取脚本，npm run fetch 会跑它
│   └── wechat-export.ts # 导出公众号 Markdown（带本地配图）
├── src/               # 前端页面与组件（Astro）
├── exports/           # 导出的公众号稿件与配图（默认已在 .gitignore 忽略）
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
   `npm run wechat -- 2026-03-09` 会尝试从原文页面抓 `og:image/twitter:image` 作为配图并下载到本地；部分网站没有设置或做了限制，会导出无图版本（不影响复制发布）。

5. **导出的文件在哪里？**  
   - Markdown：`exports/wechat/2026-03-09/2026-03-09.md`  
   - 配图：`exports/wechat/2026-03-09/assets/`

以上步骤足够完成「抓数据 → 可选增强 → 本地看站 → 打包/部署」全流程；不熟悉前端也只需按顺序执行命令即可。
