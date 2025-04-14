import { WebSocket } from "ws";

export type ConnectionMap = Record<
  string, // connectionName
  {
    ws: WebSocket | null;
    frontendStatus: "pending" | "sent" | "initialized";
    // TODO - buffer events if connection to frontend or backend somehow lost
    events?: any[];
    status: "connected" | "hangup";
    clientMetaData?: any;
  }
>;
