import { defineConfig } from "vitest/config";
import path from "node:path";
import react from "@vitejs/plugin-react";

// Unit + component tests. Contract tests live in tests/contract and share this
// config (run via `pnpm test:contract`). E2E/a11y run under Playwright instead.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/unit/setup.ts"],
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}", "tests/contract/**/*.{test,spec}.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["lib/**/*.ts", "components/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
      exclude: ["src/generated/**", "**/*.d.ts", "**/{layouts,pages}.ts", "app/**/layout.tsx"],
      // Thresholds ratcheted up after API route + lib/ + component tests.
      thresholds: {
        lines: 10.5,
        statements: 10.5,
        branches: 59,
        functions: 32,
      },
    },
  },
});
