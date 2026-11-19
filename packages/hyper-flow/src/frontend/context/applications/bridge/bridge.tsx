import type { AppInternalMessage, HFEventMessage, PluginInternalMessage } from "@hyper-fetch/plugin-devtools";
import { InternalEvents, MessageOrigin, SocketTopics } from "@hyper-fetch/plugin-devtools";
import { Socket } from "@hyper-fetch/sockets";
import { memo, useEffect } from "react";

import { createMirrorClient } from "./mirror-client";
import { ConnectionName } from "@/constants/connection.name";
import { defaultSimulatedError, useApplications } from "@/store/applications/apps.store";
import { useConnectionStore } from "@/store/applications/connection.store";
import { initializeApplicationStores } from "@/store/applications/initialize";

/**
 * The renderer's connection to the HyperFlow server. Receives the plugin handshakes and hangups, and owns the
 * listener and emitter every application uses to exchange events with its plugin.
 */
export const Bridge = memo(({ port, address = "localhost" }: { port: number; address?: string }) => {
  useEffect(() => {
    const { addConnection, updateConnection, disconnectAll } = useConnectionStore.getState();
    const { addApplication } = useApplications.getState();

    const socket = new Socket({
      url: `ws://${address}:${port}`,
      adapterOptions: { autoConnect: false },
      reconnect: Infinity,
      reconnectTime: 4000,
    }).setQueryParams({ connectionName: ConnectionName.HF_DEVTOOLS_FRONTEND, origin: MessageOrigin.APP });

    // Plugins report themselves again once the server sees the renderer, so nothing is marked online here
    const unmountDisconnected = socket.events.onDisconnected(() => {
      disconnectAll();
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

    const unmountListener = devtoolsListener.listen((event) => {
      const { connectionName, messageType, eventType, environment, clientOptions, adapterOptions } = event.data;

      switch (eventType) {
        case InternalEvents.PLUGIN_INITIALIZED: {
          const client = createMirrorClient({ clientOptions, adapterOptions });
          initializeApplicationStores(connectionName);

          addConnection({
            name: connectionName,
            clientOptions,
            adapterOptions,
            client,
            connected: true,
            eventListener,
            eventEmitter,
            environment,
          });
          addApplication({
            name: connectionName,
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
          updateConnection(connectionName, {
            connected: false,
          });
          return;
        }
        default: {
          console.error(`Unknown message type: ${messageType}`);
        }
      }
    });

    socket.connect();

    return () => {
      unmountListener();
      unmountDisconnected();
      socket.reconnectAttempts = 0;
      socket.disconnect();
      disconnectAll();
    };
  }, [address, port]);

  return null;
});
