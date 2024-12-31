import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Dengarkan di semua alamat (termasuk IP publik)
    port: 5173, // Port default Vite (atau ganti sesuai kebutuhan)
    strictPort: true, // Pastikan Vite gagal jika port sudah digunakan
    proxy: {
      "/api": {
        target: "http://172.17.42.175:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
