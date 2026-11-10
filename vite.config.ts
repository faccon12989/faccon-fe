import { resolve } from "node:path";
import { defineConfig } from "vite";

/* 네 페이지: 서비스 소개(index) · 시작하기(start) · 내 업무(my) · 운영 콘솔(app)
   base "./" — 하위 경로나 커스텀 도메인 어디서든 그대로 동작하게 한다. */
export default defineConfig({
  base: "./",
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
