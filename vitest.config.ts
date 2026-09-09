import { defineConfig } from "vitest/config";
import path from "node:path";

// Unit + component tests. Contract tests live in tests/contract and share this
// config (run via `pnpm test:contract`). E2E/a11y run under Playwright instead.
export default defineConfig({
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
      // TODO: re-enable thresholds once test coverage catches up (scaffold stage).
    },
  },
});
