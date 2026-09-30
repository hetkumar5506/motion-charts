import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

function preserveUseClient(): Plugin {
  return {
    name: "preserve-use-client",
    renderChunk(code, chunk) {
      if (!chunk.isEntry || code.startsWith('"use client";')) return null;
      return { code: `"use client";\n${code}`, map: null };
    }
  };
}

export default defineConfig({
  plugins: [react(), preserveUseClient()],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "MotionCharts",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs")
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "framer-motion"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
          "framer-motion": "Motion"
        }
      }
    },
    sourcemap: false
  }
});
