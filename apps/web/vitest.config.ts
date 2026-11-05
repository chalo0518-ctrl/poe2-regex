import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@poe2-regex/regex": path.resolve(import.meta.dirname, "../../packages/regex/src/index.ts"),
      "@poe2-regex/data": path.resolve(import.meta.dirname, "../../packages/data/src/index.ts"),
    },
  },
  test: {
    environment: "jsdom",
    // Crafting page tests render two full affix libraries. On CI that exceeds
    // Vitest's 5s default (the desecration-lock test already does on main).
    testTimeout: 15_000,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "pagesBase.test.ts"],
    setupFiles: ["./src/test-setup.ts"],
  },
});
