import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL("index.html", import.meta.url)),
        playground: fileURLToPath(new URL("playground.html", import.meta.url)),
        syntax: fileURLToPath(new URL("syntax.html", import.meta.url)),
        api: fileURLToPath(new URL("api.html", import.meta.url)),
        examples: fileURLToPath(new URL("examples.html", import.meta.url)),
        roadmap: fileURLToPath(new URL("roadmap.html", import.meta.url))
      }
    }
  },
  resolve: {
    alias: {
      markhome: fileURLToPath(new URL("../../packages/markhome/src/index.ts", import.meta.url)),
      "@bkalafat/markhome-core": fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)),
      "@bkalafat/markhome-svg": fileURLToPath(new URL("../../packages/svg/src/index.ts", import.meta.url))
    }
  }
});
