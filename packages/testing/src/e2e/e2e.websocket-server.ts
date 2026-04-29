import { WebSocketServer, WebSocket } from "ws";
import http from "http";

export const createWebsocketE2EServer = () => {
  let wss: WebSocketServer | null = null;
  let server: http.Server | null = null;
  let port = 0;
  const clients: WebSocket[] = [];

  const startServer = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      server = http.createServer();
      wss = new WebSocketServer({ server });

      wss.on("connection", (ws) => {
        clients.push(ws);
        ws.on("close", () => {
          const idx = clients.indexOf(ws);
          if (idx !== -1) clients.splice(idx, 1);
        });
      });

      server.listen(0, "127.0.0.1", () => {
        const addr = server!.address();
        if (addr && typeof addr === "object") {
          port = addr.port;
          resolve(`ws://127.0.0.1:${port}`);
        } else {
          reject(new Error("Failed to get server address"));
        }
      });

      server.on("error", reject);
    });
  };

  const stopServer = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      clients.forEach((ws) => {
        try {
          ws.terminate();
        } catch {
          // already closed
        }
      });
      clients.length = 0;

      if (wss) {
        wss.close();
        wss = null;
      }

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

  const restartServer = async (): Promise<string> => {
    await stopServer();
    return startServer();
  };

  const sendToAll = (topic: string, data: unknown) => {
    const message = JSON.stringify({ topic, data });
    clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  };

  const sendToClient = (index: number, topic: string, data: unknown) => {
    const ws = clients[index];
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ topic, data }));
    }
  };

  const sendRawToAll = (raw: string) => {
    clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(raw);
      }
    });
  };

  const closeAllClients = (code?: number, reason?: string) => {
    [...clients].forEach((ws) => {
      ws.close(code, reason);
    });
  };

  const closeClient = (index: number, code?: number, reason?: string) => {
    const ws = clients[index];
    if (ws) ws.close(code, reason);
  };

  const terminateAllClients = () => {
    [...clients].forEach((ws) => {
      ws.terminate();
    });
  };

  const getConnectedClients = () => clients.filter((ws) => ws.readyState === WebSocket.OPEN);

  const getConnectedCount = () => getConnectedClients().length;

  const waitForClient = (timeout = 5000): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      if (!wss) {
        reject(new Error("Server not started"));
        return;
      }
      const timer = setTimeout(() => reject(new Error("waitForClient timeout")), timeout);
      wss.once("connection", (ws) => {
        clearTimeout(timer);
        resolve(ws);
      });
    });
  };

  const waitForMessage = (timeout = 5000): Promise<{ topic: string; data: unknown }> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("waitForMessage timeout"));
      }, timeout);

      const handler = (ws: WebSocket) => {
        const msgHandler = (raw: Buffer | string) => {
          clearTimeout(timer);
          wss?.off("connection", handler);
          try {
            resolve(JSON.parse(raw.toString()));
          } catch {
            resolve({ topic: "", data: raw.toString() });
          }
        };
        ws.once("message", msgHandler);
      };

      clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.once("message", (raw) => {
            clearTimeout(timer);
            try {
              resolve(JSON.parse(raw.toString()));
            } catch {
              resolve({ topic: "", data: raw.toString() });
            }
          });
        }
      });

      if (wss) {
        wss.on("connection", handler);
      }
    });
  };

  const onMessage = (callback: (msg: { topic: string; data: unknown }, ws: WebSocket) => void) => {
    if (!wss) return;
    const connectionHandler = (ws: WebSocket) => {
      ws.on("message", (raw) => {
        try {
          callback(JSON.parse(raw.toString()), ws);
        } catch {
          callback({ topic: "", data: raw.toString() }, ws);
        }
      });
    };
    clients.forEach((ws) => connectionHandler(ws));
    wss.on("connection", connectionHandler);
  };

  const getUrl = () => `ws://127.0.0.1:${port}`;

  return {
    startServer,
    stopServer,
    restartServer,
    sendToAll,
    sendToClient,
    sendRawToAll,
    closeAllClients,
    closeClient,
    terminateAllClients,
    getConnectedClients,
    getConnectedCount,
    waitForClient,
    waitForMessage,
    onMessage,
    getUrl,
  };
};
