import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Bütün API çağırışları
      "/api": {
        target: "https://localhost:7168",
        changeOrigin: true,
        secure: false, // dev cert üçündür
      },
      // Sağlamlıq yoxlaması
      "/_ping": {
        target: "https://localhost:7168",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
