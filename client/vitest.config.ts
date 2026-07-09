import { defineConfig } from "vitest/config";
import viteReact from "@vitejs/plugin-react";
import path from "node:path";

// Standalone config: tests don't need the TanStack Start / Nitro / Tailwind
// plugins from vite.config.ts, and loading them would slow every run.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  plugins: [viteReact()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
