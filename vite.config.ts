import { resolve } from "node:path";
import { defineConfig } from "vite";

/* 두 페이지: 서비스 소개(index) + 운영 화면 데모(app) */
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        site: resolve(__dirname, "index.html"),
        app: resolve(__dirname, "app.html"),
        start: resolve(__dirname, "start.html"),
        my: resolve(__dirname, "my.html"),
      },
    },
  },
});
