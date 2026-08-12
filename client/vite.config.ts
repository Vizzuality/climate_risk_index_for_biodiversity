import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitroV2Plugin } from "@tanstack/nitro-v2-vite-plugin";
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
    tanstackStart(),
    nitroV2Plugin({
      compatibilityDate: "2026-07-09",
      // Content-hashed assets (duckdb wasm ~8MB gzip among them) and the
      // version-pathed duckdb extension are safe to cache forever; without
      // this Vercel serves them max-age=0 and re-downloads the wasm on
      // every visit.
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
});
