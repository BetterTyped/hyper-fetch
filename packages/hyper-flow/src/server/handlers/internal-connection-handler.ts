import { WebSocket } from "ws";
import { AppInternalMessage, InternalEvents, MessageType, PluginInternalMessage } from "@hyper-fetch/plugin-devtools";
import { serverLogger } from "@shared/utils/logger";
import { SocketTopics } from "@shared/topics";

import { AppConnectionStatus, ConnectionMap } from "../types/connection.type";

export class InternalConnectionHandler {
  connections: ConnectionMap = {};
  appConnection: WebSocket | null = null;

  constructor(connections: ConnectionMap, appConnection: WebSocket | null) {
    this.connections = connections;
    this.appConnection = appConnection;
  }

  handleInternalMessage = (message: PluginInternalMessage | AppInternalMessage) => {
    switch (message.data.eventType) {
      case InternalEvents.PLUGIN_INITIALIZED:
        this.sendPluginHandshakeToApp(message.data.connectionName, message as PluginInternalMessage);
        break;
      case InternalEvents.APP_INITIALIZED:
        this.sendAppHandshakeResponseToPlugin(message.data.connectionName);
        break;
      default: {
        serverLogger.warning("Unhandled communication event received", {
          context: "WebSocketServer",
          details: {
            messageType: message.data.messageType,
            connectionName: message.data.connectionName,
            fullMessage: message,
          },
        });
        break;
      }
    }
  };

  sendPluginHandshakeToApp = (connectionName: string, message: PluginInternalMessage) => {
    if (!this.connections[connectionName]) {
      throw new Error(`No open connection exists for the connectionName ${connectionName}`);
    }
    if (!this.appConnection || !message) {
      /**
       * This error can happen when the devtools plugin connects to the fake server
       * We found this case being triggered with msw setup, which caused websocket to open
       * We early return here to avoid the error on the startup of the devtools app
       */
      serverLogger.error("Failed to send connected apps info to devtools frontend", {
        context: "ConnectionHandler",
        details: {
          reason: "Missing frontend connection or message data",
          connectionName,
          hasFrontendConnection: !!this.appConnection,
          hasMessage: !!message,
          activeConnections: Object.keys(this.connections),
        },
      });
      return;
    }
    this.appConnection?.send(
      JSON.stringify({
        ...{
          topic: SocketTopics.APP_MAIN_LISTENER,
          data: {
            messageType: MessageType.INTERNAL,
            eventType: InternalEvents.PLUGIN_INITIALIZED,
            connectionName,
            eventData: message.data.eventData,
          },
        },
      }),
    );
    this.connections[connectionName].appStatus = AppConnectionStatus.IN_PROGRESS;
    this.connections[connectionName].clientMetaData = message;
  };

  sendAppHandshakeResponseToPlugin = (connectionName: string) => {
    if (!this.connections[connectionName]) {
      serverLogger.error("Failed to initialize devtools frontend", {
        context: "ConnectionHandler",
        details: {
          reason: "Connection not found in active connections",
          connectionName,
          activeConnections: Object.keys(this.connections),
        },
      });
      return;
    }
    this.connections[connectionName].ws?.send(
      JSON.stringify({
        data: { messageType: InternalEvents.APP_INITIALIZED },
        topic: SocketTopics.DEVTOOLS_PLUGIN_LISTENER,
      }),
    );
    this.connections[connectionName].appStatus = AppConnectionStatus.INITIALIZED;
  };
}
