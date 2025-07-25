
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    ...(mode === 'development' && {
      proxy: {
        '/analyze': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
        '/similar': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
        '/health': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      }
    })
  },
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      // 'framer-motion' is no longer externalized.
    }
  }
}));
