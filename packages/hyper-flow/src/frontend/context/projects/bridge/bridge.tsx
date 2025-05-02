import { memo } from "react";
import { Client } from "@hyper-fetch/core";
import { useDidMount } from "@reins/hooks";
import { Socket } from "@hyper-fetch/sockets";

import { BaseMessage, MessageType } from "types/messages.types";
import { SocketTopics } from "frontend/constants/topics";
import { ConnectionName } from "frontend/constants/connection.name";
import { defaultSimulatedError, useProjects } from "frontend/store/project/projects.store";
import { useConnectionStore } from "frontend/store/project/connection.store";

export const Bridge = memo(({ port, address = "localhost" }: { port: number; address?: string }) => {
  const addConnection = useConnectionStore((state) => state.addConnection);
  const updateConnection = useConnectionStore((state) => state.updateConnection);
  const addProject = useProjects((state) => state.addProject);

  useDidMount(() => {
    const nameRef = { current: "" };

    const socket = new Socket({
      url: `ws://${address}:${port}`,
      adapterOptions: { autoConnect: false },
      reconnect: Infinity,
      reconnectTime: 4000,
    })
      .setQueryParams({ connectionName: ConnectionName.HF_DEVTOOLS_FRONTEND })
      .onConnected(() => {
        if (!nameRef.current) return;

        updateConnection(nameRef.current, {
          connected: true,
        });
      })
      .onDisconnected(() => {
        if (!nameRef.current) return;

        updateConnection(nameRef.current, {
          connected: false,
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
      const { connectionName, messageType, eventData } = event.data;

      const name = connectionName;
      nameRef.current = name;

      switch (messageType) {
        case MessageType.DEVTOOLS_PLUGIN_INIT: {
          const client = new Client({ url: eventData.clientOptions.url });

          addConnection({
            name,
            metaData: eventData,
            client,
            connected: true,
            eventListener,
            eventEmitter,
          });
          addProject({
            name,
            environment: eventData.environment,
            adapterName: client.adapter.name,
            url: client.url,
            settings: {
              simulatedErrors: {
                Default: defaultSimulatedError,
              },
              maxRequestsHistorySize: 1000,
            },
          });
          return;
        }
        case MessageType.DEVTOOLS_PLUGIN_HANGUP: {
          updateConnection(nameRef.current, {
            connected: false,
          });
          return;
        }
        default: {
          console.error(`Unknown message type: ${messageType}`);
        }
      }
    });
  });

  return null;
});
