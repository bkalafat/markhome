import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      markhome: fileURLToPath(new URL("../../packages/markhome/src/index.ts", import.meta.url)),
      "@markhome/core": fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)),
      "@markhome/svg": fileURLToPath(new URL("../../packages/svg/src/index.ts", import.meta.url))
    }
  }
});
