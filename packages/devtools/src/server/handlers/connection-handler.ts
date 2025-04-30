import { WebSocket } from "ws";

import { ConnectionMap } from "../types/connection.type";
import { ConnectionName } from "../../frontend/constants/connection.name";
import { SocketTopics } from "../../frontend/constants/topics";
import { DevtoolsClientHandshakeMessage, EmitableCustomEvents, MessageType } from "../../types/messages.types";
import { serverLogger } from "utils/logger";

export class ConnectionHandler {
  connections: ConnectionMap = {};
  devtoolsFrontendConnection: WebSocket | null = null;

  setDevtoolsFrontendConnection = (connection: WebSocket | null) => {
    this.devtoolsFrontendConnection = connection;
  };

  sendConnectedAppsInfoToDevtoolsFrontend = (connectionName: string, message: DevtoolsClientHandshakeMessage) => {
    if (!this.connections[connectionName]) {
      throw new Error(`No open connection exists for the connectionName ${connectionName}`);
    }
    if (!this.devtoolsFrontendConnection || !message) {
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
          hasFrontendConnection: !!this.devtoolsFrontendConnection,
          hasMessage: !!message,
          activeConnections: Object.keys(this.connections),
        },
      });
      return;
    }
    this.devtoolsFrontendConnection.send(
      JSON.stringify({
        ...{
          topic: SocketTopics.DEVTOOLS_APP_MAIN_LISTENER,
          data: { messageType: MessageType.DEVTOOLS_PLUGIN_INIT, connectionName, eventData: message.data.eventData },
        },
      }),
    );
    this.connections[connectionName].frontendStatus = "sent";
    this.connections[connectionName].clientMetaData = message;
  };

  sendMessageToDevtoolsPlugin = (devtoolsConnectionName: string, message: string) => {
    if (!this.connections[devtoolsConnectionName]) {
      throw new Error(`No connection exists for the connectionName ${devtoolsConnectionName}`);
    }
    if (!this.connections[devtoolsConnectionName].ws) {
      serverLogger.error("Failed to send message to devtools plugin", {
        context: "ConnectionHandler",
        details: {
          reason: "WebSocket connection is not available",
          connectionName: devtoolsConnectionName,
          connectionStatus: this.connections[devtoolsConnectionName].status,
          frontendStatus: this.connections[devtoolsConnectionName].frontendStatus,
          messageType: JSON.parse(message)?.data?.messageType,
        },
      });
      return;
    }
    this.connections[devtoolsConnectionName].ws.send(message);
  };

  sendMessageToDevtoolsFrontend = (message: string) => {
    this.devtoolsFrontendConnection?.send(message);
  };

  handleDevtoolsFrontendInitialization = (connectionName: string) => {
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
    this.sendMessageToDevtoolsPlugin(
      connectionName,
      JSON.stringify({
        data: { messageType: "CLIENT_INITIALIZED" },
        topic: SocketTopics.DEVTOOLS_PLUGIN_LISTENER,
      }),
    );
    this.connections[connectionName].frontendStatus = "initialized";
  };

  addPluginConnection = (connectionName: string, connection: WebSocket) => {
    if (!this.connections[connectionName]) {
      this.connections[connectionName] = { ws: connection, frontendStatus: "pending", status: "connected" };
    } else {
      this.connections[connectionName].ws = connection;
    }
  };

  handleNewConnection = (connectionName: string | string[], conn: WebSocket): void => {
    if (connectionName && !Array.isArray(connectionName) && connectionName !== ConnectionName.HF_DEVTOOLS_FRONTEND) {
      this.addPluginConnection(connectionName, conn);
    }

    if (connectionName && connectionName === ConnectionName.HF_DEVTOOLS_FRONTEND) {
      this.setDevtoolsFrontendConnection(conn);
      if (Object.keys(this.connections).length !== 0) {
        Object.entries(this.connections).forEach(([connName, connectionData]) => {
          this.sendConnectedAppsInfoToDevtoolsFrontend(connName, connectionData.clientMetaData);
        });
      }
    }
  };

  handleClosedConnection = (connectionName: string) => {
    if (connectionName === ConnectionName.HF_DEVTOOLS_FRONTEND) {
      this.setDevtoolsFrontendConnection(null);
    }

    if (this.connections[connectionName]) {
      const hangupConnection = this.connections[connectionName];
      hangupConnection.ws = null;
      hangupConnection.status = "hangup";

      if (!this.devtoolsFrontendConnection) {
        serverLogger.error("Connection termination failed", {
          context: "ConnectionHandler",
          details: {
            reason: "Devtools frontend connection is not available",
            connectionName,
            connectionStatus: hangupConnection.status,
            frontendStatus: hangupConnection.frontendStatus,
            activeConnections: Object.keys(this.connections),
          },
        });
        return;
      }

      this.devtoolsFrontendConnection.send(
        JSON.stringify({
          ...{
            topic: SocketTopics.DEVTOOLS_APP_MAIN_LISTENER,
            data: {
              messageType: MessageType.DEVTOOLS_PLUGIN_HANGUP,
              connectionName,
              eventType: EmitableCustomEvents.PLUGIN_HANGUP,
            },
          },
        }),
      );
    }
  };
}
