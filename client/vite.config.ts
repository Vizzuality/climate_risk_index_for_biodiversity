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
    nitroV2Plugin(),
    // react's vite plugin must come after start's vite plugin
    viteReact(),
  ],
});
