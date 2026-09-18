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
    include: ["src/**/*.test.tsx"],
    setupFiles: ["./src/test-setup.ts"],
  },
});
