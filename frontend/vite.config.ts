import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-icons": ["lucide-react"],
          "vendor-http": ["axios"],
          // Feature chunks (lazy load)
          "feature-editor": [
            "./src/features/editor/components/EditorPage.tsx",
            "./src/features/editor/components/ImageViewer.tsx",
            "./src/features/editor/components/LayerPanel.tsx",
          ],
        },
      },
    },
    // Target modern browsers
    target: "es2020",
    // Enable source maps for debugging
    sourcemap: false,
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
  },
});
