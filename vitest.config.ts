import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts",
    // e2e/ holds Playwright specs, not Vitest specs — Vitest's default glob
    // would otherwise pick them up and crash on `test.describe()`.
    exclude: ["node_modules/**", "e2e/**", ".next/**"],
    // No Vitest unit test files exist yet (see README Testing section) —
    // don't fail the run for having zero tests to collect.
    passWithNoTests: true,
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", ".next/", "tests/", "*.config.ts", "*.config.js"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
})
