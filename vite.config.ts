import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: "src/index.tsx",
      formats: ["iife"],
      name: "AntigravityProviderPlugin",
      fileName: () => "index.js",
    },
    outDir: "plugin/dist",
    rollupOptions: {
      external: ["react", "react-dom", "@proxycast/plugin-components"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "@proxycast/plugin-components": "ProxyCastPluginComponents",
        },
      },
    },
  },
});
