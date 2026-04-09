# 参与贡献

感谢你有兴趣改进 Eyes。

## 开发前

1. Fork 本仓库并克隆到本地。
2. `npm install`
3. 复制 `.env.example` 为 `.env`，按需设置 `PH_TOKEN` 等。

## 提交 PR 时请注意

- **不要**提交 `.env`、个人 MCP 密钥或任何令牌。
- **`data/` 默认被 git 忽略**，请勿在 PR 中提交抓取数据或大体积配图；若需复现问题，可附最小化的匿名化片段或说明步骤。
- 变更脚本后可在本地运行 `npx tsc --noEmit` 做类型检查。

## 代码风格

与现有 TypeScript 脚本保持一致即可；无单独格式化流水线时，避免无关大范围的格式重排。

## 行为准则

请保持相互尊重。若需正式行为准则，可后续补充 `CODE_OF_CONDUCT.md`（例如 Contributor Covenant）。
