import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { resolvePagesBase } from "./pagesBase.ts";

const pagesBase = resolvePagesBase({
  PAGES_BASE: process.env.PAGES_BASE,
  GITHUB_PAGES: process.env.GITHUB_PAGES,
});

export default defineConfig({
  base: pagesBase,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@poe2-regex/regex": path.resolve(import.meta.dirname, "../../packages/regex/src/index.ts"),
      "@poe2-regex/data": path.resolve(import.meta.dirname, "../../packages/data/src/index.ts"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 43127,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 43127,
    strictPort: true,
  },
});
