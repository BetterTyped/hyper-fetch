import { memo } from "react";
import { Client } from "@hyper-fetch/core";
import { useDidMount } from "@reins/hooks";
import { Socket } from "@hyper-fetch/sockets";

import { BaseMessage, MessageType } from "types/messages.types";
import { SocketTopics } from "frontend/lib/socket/topics";
import { ConnectionName } from "frontend/constants/connection.name";
import { Connection, useConnections } from "../connection/connection";
import { useProjects } from "frontend/store/projects.store";

export const Bridge = memo(({ port, address = "localhost" }: { port: number; address?: string }) => {
  const { connections, setConnections } = useConnections("Bridge");
  const { addProject } = useProjects();

  useDidMount(() => {
    const nameRef = { current: "" };

    const socket = new Socket({
      url: `ws://${address}:${port}`,
      adapterOptions: { autoConnect: false },
    })
      .setQueryParams({ connectionName: ConnectionName.HF_DEVTOOLS_APP })
      .onConnected(() => {
        if (!nameRef.current) return;

        setConnections((prev) => {
          return {
            ...prev,
            [nameRef.current]: {
              ...prev[nameRef.current],
              connected: true,
            },
          };
        });
      })
      .onDisconnected(() => {
        if (!nameRef.current) return;

        setConnections((prev) => {
          return {
            ...prev,
            [nameRef.current]: {
              ...prev[nameRef.current],
              connected: false,
            },
          };
        });
      });

    const devtoolsListener = socket.createListener<BaseMessage["data"]>()({
      topic: SocketTopics.DEVTOOLS_APP_MAIN_LISTENER,
    });

    const eventListener = socket.createListener<BaseMessage["data"]>()({
      topic: SocketTopics.DEVTOOLS_APP_CLIENT_LISTENER,
    });

    const eventEmitter = socket.createEmitter<BaseMessage["data"]>()({
      topic: SocketTopics.DEVTOOLS_APP_CLIENT_EMITTER,
    });

    socket.connect();

    // TODO - Kacper fix this type?
    devtoolsListener.listen((event: any) => {
      const { connectionName, messageType } = event.data;

      nameRef.current = connectionName;

      switch (messageType) {
        case MessageType.DEVTOOLS_CLIENT_INIT:
          {
            const shouldCreateProject = !connections[connectionName];
            if (shouldCreateProject) {
              setConnections((prev) => {
                return {
                  ...prev,
                  [connectionName]: {
                    name: connectionName,
                    client: new Client({ url: "http://localhost.dummyhost:5000" }),
                    connected: true,
                    eventListener,
                    eventEmitter,
                  } satisfies Connection,
                };
              });
              addProject({
                name: connectionName,
                settings: {
                  simulatedErrors: {
                    Default: new Error("This is error simulated by HyperFetch Devtools"),
                  },
                  maxRequestsHistorySize: 1000,
                },
              });
            }
          }
          return;
        default:
          console.error(`Unknown message type: ${messageType}`);
      }
    });
  });

  return null;
});
