import { WebSocket } from "ws";

export type ConnectionMap = Record<
  string, // connectionName
  {
    ws: WebSocket | null;
    frontendStatus: "pending" | "sent" | "initialized";
    events?: any[];
    status: "connected" | "hangup";
    clientMetaData?: any;
  }
>;
