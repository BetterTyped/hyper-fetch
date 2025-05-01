import { WebSocketServer } from "ws";

export const initializeWebsocketServer = (port: number) => {
  const wss = new WebSocketServer({ port });
  wss.on("connection", function connection(ws: any) {
    ws.on("error", console.error);

    ws.on("message", function message(data: any, isBinary: boolean) {
      wss.clients.forEach(function each(c) {
        if (c.readyState === WebSocket.OPEN) {
          c.send(data, { binary: isBinary });
        }
      });
    });
  });
  return wss;
};
