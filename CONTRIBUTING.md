# 参与贡献

感谢你有兴趣改进 Eyes。

## 开发前

1. Fork 本仓库并克隆到本地。
2. `npm install`
3. 复制 `.env.example` 为 `.env`，按需设置 `PUBLIC_SITE_URL`、`PH_TOKEN` 等。

## 提交 PR 时请注意

- **不要**提交 `.env`、个人 MCP 密钥或任何令牌。
- 若 PR 包含新的 `data/raw` / `data/enriched` 样本，请确保内容适合公开分发；大块无意义的日期数据可能被要求缩小为最小可复现示例。
- 尽量让 `npm run build` 在 CI 或本地能通过（需至少一份 `data/raw` 或 `data/enriched` 下的 `.json`，或由维护者约定测试数据策略）。

## 代码风格

与现有 TypeScript / Astro 文件保持一致即可；无单独格式化流水线时，避免无关大范围的格式重排。

## 行为准则

请保持相互尊重。若需正式行为准则，可后续补充 `CODE_OF_CONDUCT.md`（例如 Contributor Covenant）。
