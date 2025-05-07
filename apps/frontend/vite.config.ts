import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@pm2-dashboard/shared": path.resolve(
        __dirname,
        "../../packages/shared/src"
      ),
    },
  },
  server: {
    port: Number(process.env.PORT) || 3000,
    proxy: {
      "/api": {
        target: process.env.API_HOST || "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
