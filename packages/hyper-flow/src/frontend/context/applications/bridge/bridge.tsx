import { memo } from "react";
import { Client } from "@hyper-fetch/core";
import { useDidMount } from "@better-hooks/lifecycle";
import { Socket } from "@hyper-fetch/sockets";
import {
  AppInternalMessage,
  HFEventMessage,
  InternalEvents,
  MessageOrigin,
  PluginInternalMessage,
  SocketTopics,
} from "@hyper-fetch/plugin-devtools";

import { useConnectionStore } from "@/store/applications/connection.store";
import { defaultSimulatedError, useApplications } from "@/store/applications/apps.store";
import { ConnectionName } from "@/constants/connection.name";

export const Bridge = memo(({ port, address = "localhost" }: { port: number; address?: string }) => {
  const addConnection = useConnectionStore((state) => state.addConnection);
  const updateConnection = useConnectionStore((state) => state.updateConnection);
  const addApplication = useApplications((state) => state.addApplication);

  useDidMount(() => {
    const nameRef = { current: "" };

    const socket = new Socket({
      url: `ws://${address}:${port}`,
      adapterOptions: { autoConnect: false },
      reconnect: Infinity,
      reconnectTime: 4000,
    })
      .setQueryParams({ connectionName: ConnectionName.HF_DEVTOOLS_FRONTEND, origin: MessageOrigin.APP })
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

    const devtoolsListener = socket.createListener<PluginInternalMessage["data"]>()({
      topic: SocketTopics.APP_MAIN_LISTENER,
    });

    const eventListener = socket.createListener<HFEventMessage["data"]>()({
      topic: SocketTopics.APP_INSTANCE_LISTENER,
    });

    const eventEmitter = socket.createEmitter<HFEventMessage["data"] | AppInternalMessage["data"]>()({
      topic: SocketTopics.PLUGIN_LISTENER,
    });

    socket.connect();

    devtoolsListener.listen((event) => {
      const { connectionName, messageType, eventType, environment, clientOptions, adapterOptions } = event.data;

      const name = connectionName;
      nameRef.current = name;

      switch (eventType) {
        case InternalEvents.PLUGIN_INITIALIZED: {
          const client = new Client({ url: clientOptions.url });

          addConnection({
            name,
            clientOptions,
            adapterOptions,
            client,
            connected: true,
            eventListener,
            eventEmitter,
            environment,
          });
          addApplication({
            name,
            environment,
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
        case InternalEvents.PLUGIN_HANGUP: {
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
