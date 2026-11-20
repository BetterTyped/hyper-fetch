import devServer from "@hono/vite-dev-server";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    // Runs the Hono app for every `/api` request while `vite` is running. Everything else is the React app.
    devServer({ entry: "server/app.ts", exclude: [/^(?!\/api(\/|$)).*/] }),
  ],
});
