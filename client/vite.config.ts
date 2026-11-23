import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitroV2Plugin } from "@tanstack/nitro-v2-vite-plugin";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// The static build skips Nitro: it keeps the server bundle in memory, but the
// SPA shell prerender imports it from dist/server.
const spa = process.env.SPA === "true";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  plugins: [
    tailwindcss(),
    tanstackStart({ spa: { enabled: spa } }),
    !spa &&
      nitroV2Plugin({
        compatibilityDate: "2026-07-09",
        // Nitro's own static handler cannot answer Range requests; serve-static can.
        serveStatic: false,
        handlers: [
          {
            middleware: true,
            handler: path.resolve(import.meta.dirname, "src/server/static-assets.ts"),
          },
        ],
        // Content-hashed assets (duckdb wasm ~8MB gzip among them) and the
        // version-pathed duckdb extension are safe to cache forever; without
        // this they are served with max-age=0 and the wasm is re-downloaded
        // on every visit.
        routeRules: {
          "/assets/**": {
            headers: { "cache-control": "public, max-age=31536000, immutable" },
          },
          "/duckdb-extensions/**": {
            headers: { "cache-control": "public, max-age=31536000, immutable" },
          },
        },
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
