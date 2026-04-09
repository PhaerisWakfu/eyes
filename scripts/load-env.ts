/** 为 tsx 运行的脚本从项目根目录加载 `.env`（如 `npm run fetch` / `wechat` 等）。 */
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(root, ".env") });
