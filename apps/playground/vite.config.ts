import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      markhome: fileURLToPath(new URL("../../packages/markhome/src/index.ts", import.meta.url)),
      "@markhome/core": fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)),
      "@markhome/svg": fileURLToPath(new URL("../../packages/svg/src/index.ts", import.meta.url))
    }
  },
  server: {
    host: "127.0.0.1",
    port: 5173
  }
});
