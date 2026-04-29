import http from "http";
import type { Socket } from "net";

export const createSseE2EServer = () => {
  let server: http.Server | null = null;
  let port = 0;
  const responses: http.ServerResponse[] = [];
  const sockets: Socket[] = [];

  const startServer = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      server = http.createServer((req, res) => {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": "*",
        });
        res.write("\n");

        responses.push(res);

        req.on("close", () => {
          const idx = responses.indexOf(res);
          if (idx !== -1) responses.splice(idx, 1);
        });
      });

      server.on("connection", (socket: Socket) => {
        sockets.push(socket);
        socket.on("close", () => {
          const idx = sockets.indexOf(socket);
          if (idx !== -1) sockets.splice(idx, 1);
        });
      });

      server.listen(0, "127.0.0.1", () => {
        const addr = server!.address();
        if (addr && typeof addr === "object") {
          port = addr.port;
          resolve(`http://127.0.0.1:${port}`);
        } else {
          reject(new Error("Failed to get server address"));
        }
      });

      server.on("error", reject);
    });
  };

  const stopServer = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      sockets.forEach((s) => {
        try {
          s.destroy();
        } catch {
          // already closed
        }
      });
      sockets.length = 0;
      responses.length = 0;

      if (!server) {
        resolve();
        return;
      }
      server.close((err) => {
        server = null;
        if (err) reject(err);
        else resolve();
      });
    });
  };

  const sendEvent = (topic: string, data: unknown) => {
    const payload = JSON.stringify({ topic, data });
    responses.forEach((res) => {
      if (!res.destroyed) {
        res.write(`data: ${payload}\n\n`);
      }
    });
  };

  const closeAllClients = () => {
    sockets.forEach((s) => {
      try {
        s.destroy();
      } catch {
        // already closed
      }
    });
  };

  const getConnectedCount = () => responses.filter((r) => !r.destroyed).length;

  const waitForClient = (timeout = 5000): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!server) {
        reject(new Error("Server not started"));
        return;
      }
      const initialCount = responses.length;
      const timer = setTimeout(() => reject(new Error("waitForClient timeout")), timeout);
      const interval = setInterval(() => {
        if (responses.length > initialCount) {
          clearTimeout(timer);
          clearInterval(interval);
          resolve();
        }
      }, 20);
    });
  };

  const getUrl = () => `http://127.0.0.1:${port}`;

  return {
    startServer,
    stopServer,
    sendEvent,
    closeAllClients,
    getConnectedCount,
    waitForClient,
    getUrl,
  };
};
