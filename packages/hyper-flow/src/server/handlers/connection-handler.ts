import { WebSocket } from "ws";
import {
  AppInternalMessage,
  BaseMessagePayload,
  InternalEvents,
  MessageOrigin,
  MessageType,
  PluginInternalMessage,
} from "@hyper-fetch/plugin-devtools";
import { serverLogger } from "@shared/utils/logger";
import { SocketTopics } from "@shared/topics";

import { AppConnectionStatus, ConnectionMap, PluginConnectionStatus } from "../types/connection.type";
import { InternalConnectionHandler } from "./internal-connection-handler";

import { ConnectionName } from "@/constants/connection.name";

export class ConnectionHandler {
  connections: ConnectionMap = {};
  appConnection: WebSocket | null = null;
  internalConnectionHandler: InternalConnectionHandler;

  constructor() {
    this.internalConnectionHandler = new InternalConnectionHandler(this.connections, this.appConnection);
  }

  setAppConnection = (connection: WebSocket | null) => {
    this.appConnection = connection;
  };

  handleMessage = (connectionName: string, message: { data: BaseMessagePayload }) => {
    switch (message.data.messageType) {
      case MessageType.INTERNAL:
        this.internalConnectionHandler.handleInternalMessage(message as PluginInternalMessage | AppInternalMessage);
        break;
      case MessageType.EVENT:
        this.handleEventMessage(connectionName, message);
        break;
      default:
        throw new Error(`Unknown messageType: ${message.data.messageType}`);
    }
  };

  handleEventMessage = (connectionName: string, message: { data: BaseMessagePayload }) => {
    switch (message.data.origin) {
      case MessageOrigin.PLUGIN:
        this.sendToApp(JSON.stringify({ ...message, topic: SocketTopics.APP_INSTANCE_LISTENER }));
        break;
      case MessageOrigin.APP:
        this.sendToPlugin(connectionName, JSON.stringify(message));
        break;
      default:
        throw new Error(`Unknown origin: ${message.data.origin}`);
    }
  };

  sendToPlugin = (pluginConnectionName: string, message: string) => {
    if (!this.connections[pluginConnectionName]) {
      throw new Error(`No connection exists for the connectionName ${pluginConnectionName}`);
    }
    if (!this.connections[pluginConnectionName].ws) {
      serverLogger.error("Failed to send message to devtools plugin", {
        context: "ConnectionHandler",
        details: {
          reason: "WebSocket connection is not available",
          connectionName: pluginConnectionName,
          pluginStatus: this.connections[pluginConnectionName].pluginStatus,
          frontendStatus: this.connections[pluginConnectionName].appStatus,
          messageType: JSON.parse(message)?.data?.messageType,
        },
      });
      return;
    }
    this.connections[pluginConnectionName].ws.send(message);
  };

  sendToApp = (message: string) => {
    this.appConnection?.send(message);
  };

  addPluginConnection = (connectionName: string, connection: WebSocket) => {
    if (!this.connections[connectionName]) {
      this.connections[connectionName] = {
        ws: connection,
        appStatus: AppConnectionStatus.PENDING,
        pluginStatus: PluginConnectionStatus.CONNECTED,
      };
    } else {
      this.connections[connectionName].ws = connection;
    }
  };

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
        Object.entries(this.connections).forEach(([connName, connectionData]) => {
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

    if (this.connections[connectionName]) {
      const hangupConnection = this.connections[connectionName];
      hangupConnection.ws = null;
      hangupConnection.pluginStatus = PluginConnectionStatus.HANGUP;

      if (!this.appConnection) {
        serverLogger.error("Connection termination failed", {
          context: "ConnectionHandler",
          details: {
            reason: "Devtools frontend connection is not available",
            connectionName,
            pluginStatus: hangupConnection.pluginStatus,
            appStatus: hangupConnection.appStatus,
            activeConnections: Object.keys(this.connections),
          },
        });
        return;
      }

      this.appConnection.send(
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
