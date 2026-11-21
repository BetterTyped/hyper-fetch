import type { AppInternalMessage, BaseMessagePayload, PluginInternalMessage } from "@hyper-fetch/plugin-devtools";
import { InternalEvents, MessageOrigin, MessageType, SocketTopics } from "@hyper-fetch/plugin-devtools";
import { serverLogger } from "@shared/utils/logger";
import type { WebSocket } from "ws";

import type { ConnectionMap } from "../types/connection.type";
import { AppConnectionStatus, PluginConnectionStatus } from "../types/connection.type";
import { InternalConnectionHandler } from "./internal-connection-handler";
import { ConnectionName } from "@/constants/connection.name";

type ConnectionState = {
  connections: ConnectionMap;
  appConnection: WebSocket | null;
};

export class ConnectionHandler {
  connectionState: ConnectionState = {
    // Applications name their connections, so names like "constructor" must not resolve to Object.prototype
    connections: Object.create(null),
    appConnection: null,
  };

  internalConnectionHandler: InternalConnectionHandler;

  constructor() {
    this.internalConnectionHandler = new InternalConnectionHandler(this.connectionState);
  }

  /* -------------------------------------------------------------------------------------------------
   * App
   * -----------------------------------------------------------------------------------------------*/

  setAppConnection = (connection: WebSocket | null) => {
    this.connectionState.appConnection = connection;
  };

  sendToApp = (message: string) => {
    this.connectionState.appConnection?.send(message);
  };

  /* -------------------------------------------------------------------------------------------------
   * Plugin
   * -----------------------------------------------------------------------------------------------*/

  sendToPlugin = (message: { data: BaseMessagePayload }) => {
    const pluginConnectionName = message.data.connectionName;
    if (!this.connectionState.connections[pluginConnectionName]) {
      serverLogger.error("Failed to send message to devtools plugin", {
        context: "ConnectionHandler",
        details: {
          reason: "No connection exists for this connectionName",
          connectionName: pluginConnectionName,
          activeConnections: Object.keys(this.connectionState.connections),
        },
      });
      return;
    }
    if (!this.connectionState.connections[pluginConnectionName].ws) {
      serverLogger.error("Failed to send message to devtools plugin", {
        context: "ConnectionHandler",
        details: {
          reason: "WebSocket connection is not available",
          connectionName: pluginConnectionName,
          pluginStatus: this.connectionState.connections[pluginConnectionName].pluginStatus,
          frontendStatus: this.connectionState.connections[pluginConnectionName].appStatus,
          messageType: message?.data?.messageType,
        },
      });
      return;
    }
    this.connectionState.connections[pluginConnectionName].ws.send(
      JSON.stringify({ ...message, topic: SocketTopics.PLUGIN_LISTENER }),
    );
  };

  addPluginConnection = (connectionName: string, connection: WebSocket) => {
    if (!this.connectionState.connections[connectionName]) {
      this.connectionState.connections[connectionName] = {
        ws: connection,
        appStatus: AppConnectionStatus.PENDING,
        pluginStatus: PluginConnectionStatus.CONNECTED,
      };
    } else {
      this.connectionState.connections[connectionName].ws = connection;
      this.connectionState.connections[connectionName].pluginStatus = PluginConnectionStatus.CONNECTED;
    }
  };

  /* -------------------------------------------------------------------------------------------------
   * Handlers
   * -----------------------------------------------------------------------------------------------*/

  handleMessage = (message: { data: BaseMessagePayload }) => {
    switch (message.data.messageType) {
      case MessageType.INTERNAL: {
        this.internalConnectionHandler.handleInternalMessage(message as PluginInternalMessage | AppInternalMessage);
        break;
      }
      case MessageType.EVENT: {
        this.handleEventMessage(message);
        break;
      }
      default: {
        serverLogger.warning("Unknown message type received", {
          context: "ConnectionHandler",
          details: { messageType: message.data.messageType, connectionName: message.data.connectionName },
        });
      }
    }
  };

  handleEventMessage = (message: { data: BaseMessagePayload }) => {
    switch (message.data.origin) {
      case MessageOrigin.PLUGIN: {
        this.sendToApp(JSON.stringify({ ...message, topic: SocketTopics.APP_INSTANCE_LISTENER }));
        break;
      }
      case MessageOrigin.APP: {
        this.sendToPlugin(message);
        break;
      }
      default: {
        serverLogger.warning("Event with unknown origin received", {
          context: "ConnectionHandler",
          details: { origin: message.data.origin, connectionName: message.data.connectionName },
        });
      }
    }
  };

  /* -------------------------------------------------------------------------------------------------
   * Connections
   * -----------------------------------------------------------------------------------------------*/

  handleNewConnection = (
    { connectionName, origin }: { connectionName: string; origin: MessageOrigin },
    conn: WebSocket,
  ): void => {
    switch (origin) {
      case MessageOrigin.PLUGIN: {
        this.addPluginConnection(connectionName, conn);
        break;
      }
      case MessageOrigin.APP: {
        this.setAppConnection(conn);
        Object.entries(this.connectionState.connections)
          .filter(([, connData]) => !!connData.clientMetaData)
          .forEach(([connName, connectionData]) => {
            this.internalConnectionHandler.sendPluginHandshakeToApp(connName, connectionData.clientMetaData);
          });
        break;
      }
      default: {
        serverLogger.warning("Connection with unknown origin rejected", {
          context: "ConnectionHandler",
          details: { origin, connectionName },
        });
        conn.close(1008, "Unknown origin");
      }
    }
  };

  handleClosedConnection = (
    { connectionName, origin }: { connectionName: string; origin: MessageOrigin },
    conn: WebSocket,
  ) => {
    if (origin === MessageOrigin.APP || connectionName === ConnectionName.HF_DEVTOOLS_FRONTEND) {
      // A reloaded renderer can open its new socket before the old one finishes closing
      if (this.connectionState.appConnection === conn) {
        this.setAppConnection(null);
      }
      return;
    }

    if (this.connectionState.connections[connectionName]) {
      const hangupConnection = this.connectionState.connections[connectionName];
      // The plugin may already be back on a new socket
      if (hangupConnection.ws !== conn) {
        return;
      }
      hangupConnection.ws = null;
      hangupConnection.pluginStatus = PluginConnectionStatus.HANGUP;

      if (!this.connectionState.appConnection) {
        serverLogger.error("Connection termination failed", {
          context: "ConnectionHandler",
          details: {
            reason: "Devtools frontend connection is not available",
            connectionName,
            pluginStatus: hangupConnection.pluginStatus,
            appStatus: hangupConnection.appStatus,
            activeConnections: Object.keys(this.connectionState.connections),
          },
        });
        return;
      }

      this.connectionState.appConnection.send(
        JSON.stringify({
          topic: SocketTopics.APP_MAIN_LISTENER,
          data: {
            messageType: MessageType.INTERNAL,
            eventType: InternalEvents.PLUGIN_HANGUP,
            connectionName,
          },
        }),
      );
    }
  };
}
