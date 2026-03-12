import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://eyes.phaeris.xyz",
  output: "server",
  adapter: cloudflare(),
});
