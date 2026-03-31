import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    site: env.PUBLIC_SITE_URL || "https://eyes.phaeris.xyz",
    output: "server",
    adapter: cloudflare(),
  };
});
