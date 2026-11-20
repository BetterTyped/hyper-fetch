import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const apiPort = Number(process.env.API_PORT ?? 3000);

/** Runs the Elysia server from server/app.ts while `vite` runs, and restarts it when a file in server/ changes. */
const elysiaDevServer = (): Plugin => ({
  name: "elysia-dev-server",
  apply: "serve",
  async configureServer(server) {
    let stop = async () => {};
    const start = async () => {
      const { app } = await server.ssrLoadModule("/server/app.ts");
      // The node adapter hands the running server to the callback, stopping that one frees the port for a restart.
      app.listen(apiPort, (running: { stop: () => Promise<void> }) => {
        stop = () => running.stop();
      });
    };

    await start();
    server.watcher.on("change", async (file) => {
      if (!file.includes("/server/")) return;
      await stop();
      server.moduleGraph.invalidateAll();
      await start();
    });
    server.httpServer?.on("close", () => stop());
  },
});

export default defineConfig({
  plugins: [react(), elysiaDevServer()],
  // The page calls `/api` on its own origin, Vite forwards those requests to Elysia.
  server: { proxy: { "/api": `http://localhost:${apiPort}` } },
});
