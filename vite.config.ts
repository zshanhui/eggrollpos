import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import ViteYaml from "@modyfi/vite-plugin-yaml";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    ViteYaml(),
    tailwindcss(),
    react({
      jsxRuntime: "classic",
    }),
  ],
  root: ".",
  publicDir: "public",
  esbuild: {
    loader: "tsx",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@/client": resolve(__dirname, "./src/client"),
      "@/server": resolve(__dirname, "./src/server"),
      "@/shared": resolve(__dirname, "./src/shared"),
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    manifest: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
      },
    },
  },
  server: {
    port: 3001,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      // Use /r/ prefix so /receipts/* is not proxied to Express (prefix /r would match /receipts).
      "/r/": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/t": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
