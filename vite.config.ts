import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// 개발 서버(npm run dev)에서 /api/v1/* 를 서비스별로 넘긴다 (운영은 nginx·Ingress 가 같은 일을 한다).
// 기본값은 docker compose 의 포트: reservation 8000, auth 8001, stats 8002
const AUTH = process.env.AUTH_URL ?? "http://localhost:8001";
const RESERVATION = process.env.RESERVATION_URL ?? "http://localhost:8000";
const STATS = process.env.STATS_URL ?? "http://localhost:8002";

const routes: Record<string, string> = {
  "/api/v1/auth": AUTH,
  "/api/v1/admin": AUTH,
  "/api/v1/stats": STATS,
  "/api/v1/system": STATS,
  "/api/v1": RESERVATION, // 나머지 /api/v1/* 는 예약 서비스 (가장 마지막에 둔다)
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: Object.fromEntries(Object.entries(routes).map(([path, target]) => [path, { target, changeOrigin: true }])),
  },
});
