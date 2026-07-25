import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const config = defineConfig({
  plugins: [tanstackStart(), viteReact(), cloudflare({ viteEnvironment: { name: "ssr" } })],
  resolve: {
    alias: {
      "@wasm/json-parser": fileURLToPath(
        new URL("crates/json-parser/pkg/json_parser.js", import.meta.url),
      ),
    },
    dedupe: ["@clerk/react", "@clerk/shared", "@clerk/tanstack-react-start"],
    tsconfigPaths: true,
  },
});

export default config;
