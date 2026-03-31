/**
 * 为 tsx 运行的脚本加载项目根目录 .env（与 Astro 的 env 约定一致）。
 * Astro 构建时会自行加载 .env；此处仅覆盖 npm run fetch / wechat 等 Node 脚本。
 */
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(root, ".env") });
