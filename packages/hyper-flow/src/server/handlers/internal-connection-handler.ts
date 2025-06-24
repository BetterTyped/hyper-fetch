import { WebSocket } from "ws";
import { AppInternalMessage, InternalEvents, MessageType, PluginInternalMessage } from "@hyper-fetch/plugin-devtools";
import { serverLogger } from "@shared/utils/logger";
import { SocketTopics } from "@shared/topics";

import { AppConnectionStatus, ConnectionMap } from "../types/connection.type";

type ConnectionState = {
  connections: ConnectionMap;
  appConnection: WebSocket | null;
};

export class InternalConnectionHandler {
  connectionState: ConnectionState = {
    connections: {},
    appConnection: null,
  };
  constructor(connectionState: ConnectionState) {
    this.connectionState = connectionState;
  }

  handleInternalMessage = (message: PluginInternalMessage | AppInternalMessage) => {
    switch (message.data.eventType) {
      case InternalEvents.PLUGIN_INITIALIZED:
        console.log("HANDLING INTERNAL MESSAGE");
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
    if (!this.connectionState.connections[connectionName]) {
      throw new Error(`No open connection exists for the connectionName ${connectionName}`);
    }
    if (!this.connectionState.appConnection || !message) {
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
          hasFrontendConnection: !!this.connectionState.appConnection,
          hasMessage: !!message,
          activeConnections: Object.keys(this.connectionState.connections),
        },
      });
      return;
    }
    this.connectionState.appConnection?.send(
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
    this.connectionState.connections[connectionName].appStatus = AppConnectionStatus.IN_PROGRESS;
    this.connectionState.connections[connectionName].clientMetaData = message;
  };

  sendAppHandshakeResponseToPlugin = (connectionName: string) => {
    if (!this.connectionState.connections[connectionName]) {
      serverLogger.error("Failed to initialize devtools frontend", {
        context: "ConnectionHandler",
        details: {
          reason: "Connection not found in active connections",
          connectionName,
          activeConnections: Object.keys(this.connectionState.connections),
        },
      });
      return;
    }
    this.connectionState.connections[connectionName].ws?.send(
      JSON.stringify({
        data: { messageType: InternalEvents.APP_INITIALIZED },
        topic: SocketTopics.DEVTOOLS_PLUGIN_LISTENER,
      }),
    );
    this.connectionState.connections[connectionName].appStatus = AppConnectionStatus.INITIALIZED;
  };
}
