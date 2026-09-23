import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      // Nothing renders on the server (data is read in the browser through
      // duckdb-wasm and the map is client-only), so the app ships as a single
      // prerendered shell; this is also what a static host needs.
      spa: { enabled: true },
    }),
    // react's vite plugin must come after start's vite plugin
    viteReact(),
  ],
  build: {
    target: "esnext",
  },
  // The GeoTIFF decoder worker pulls in a dependency that uses top-level
  // await, which the default iife worker bundle cannot express.
  worker: { format: "es" },
});
