import { WebSocket } from "ws";

import { ConnectionMap } from "../types/connection.type";
import { ConnectionName } from "../../frontend/constants/connection.name";
import { SocketTopics } from "../../frontend/constants/topics";
import { DevtoolsClientHandshakeMessage, EmitableCustomEvents, MessageType } from "../../types/messages.types";

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
    if (!this.devtoolsFrontendConnection) {
      throw new Error(`Something went wrong, connection to frontend connection does not exist`);
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
    this.connections[devtoolsConnectionName].ws!.send(message);
  };

  sendMessageToDevtoolsFrontend = (message: string) => {
    this.devtoolsFrontendConnection?.send(message);
  };

  handleDevtoolsFrontendInitialization = (connectionName: string) => {
    if (!this.connections[connectionName]) {
      console.error(`CONNECTION ${connectionName} DOES NOT EXIST`);
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
    if (connectionName && !Array.isArray(connectionName) && connectionName.startsWith("HF_DEVTOOLS_PLUGIN")) {
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
      // TODO - should we handle the case when both sides are disconnected?
      if (!this.devtoolsFrontendConnection) {
        console.error(`Something went wrong. Connection to devtools frontend and devtools plugin lost.`);
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
