import { WebSocket } from "ws";
import {
  AppInternalMessage,
  BaseMessagePayload,
  InternalEvents,
  MessageOrigin,
  MessageType,
  PluginInternalMessage,
  SocketTopics,
} from "@hyper-fetch/plugin-devtools";
import { serverLogger } from "@shared/utils/logger";

import { AppConnectionStatus, ConnectionMap, PluginConnectionStatus } from "../types/connection.type";
import { InternalConnectionHandler } from "./internal-connection-handler";

import { ConnectionName } from "@/constants/connection.name";

type ConnectionState = {
  connections: ConnectionMap;
  appConnection: WebSocket | null;
};

export class ConnectionHandler {
  connectionState: ConnectionState = {
    connections: {},
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
      throw new Error(`No connection exists for the connectionName ${pluginConnectionName}`);
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
    }
  };

  /* -------------------------------------------------------------------------------------------------
   * Handlers
   * -----------------------------------------------------------------------------------------------*/

  handleMessage = (message: { data: BaseMessagePayload }) => {
    switch (message.data.messageType) {
      case MessageType.INTERNAL:
        this.internalConnectionHandler.handleInternalMessage(message as PluginInternalMessage | AppInternalMessage);
        break;
      case MessageType.EVENT:
        this.handleEventMessage(message);
        break;
      default:
        throw new Error(`Unknown messageType: ${message.data.messageType}`);
    }
  };

  handleEventMessage = (message: { data: BaseMessagePayload }) => {
    switch (message.data.origin) {
      case MessageOrigin.PLUGIN:
        this.sendToApp(JSON.stringify({ ...message, topic: SocketTopics.APP_INSTANCE_LISTENER }));
        break;
      case MessageOrigin.APP:
        this.sendToPlugin(message);
        break;
      default:
        throw new Error(`Unknown origin: ${message.data.origin}`);
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
      case MessageOrigin.PLUGIN:
        this.addPluginConnection(connectionName, conn);
        break;
      case MessageOrigin.APP:
        this.setAppConnection(conn);
        // TODO add tests ?
        Object.entries(this.connectionState.connections).forEach(([connName, connectionData]) => {
          this.internalConnectionHandler.sendPluginHandshakeToApp(connName, connectionData.clientMetaData);
        });
        break;
      default:
        throw new Error(`Unknown origin: ${origin} for ${connectionName}`);
    }
  };

  handleClosedConnection = (connectionName: string) => {
    if (connectionName === ConnectionName.HF_DEVTOOLS_FRONTEND) {
      // TODO - should we send this info to plugin in order to stop sending messages ?
      this.setAppConnection(null);
    }

    if (this.connectionState.connections[connectionName]) {
      const hangupConnection = this.connectionState.connections[connectionName];
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
          ...{
            topic: SocketTopics.APP_MAIN_LISTENER,
            data: {
              messageType: MessageType.INTERNAL,
              eventType: InternalEvents.PLUGIN_HANGUP,
              connectionName,
            },
          },
        }),
      );
    }
  };
}
