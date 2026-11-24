import { createReconnectingConnection, SocketAdapter } from "@hyper-fetch/sockets";

type Frame = { topic: string; data: unknown };

/**
 * A socket transport that never leaves the browser, so the example runs without a server. Frames travel over a
 * `BroadcastChannel` named after the socket URL instead of a WebSocket: the fake server in `server.ts` publishes on it,
 * and every tab of this site receives the frame, this one included. With a real backend you pass no adapter and get
 * the WebSocket adapter instead. Listeners, syncs and the db do not change.
 */
export const BroadcastChannelAdapter = () =>
  new SocketAdapter({ name: "broadcast-channel" }).setConnector((bindings) => {
    let channel: BroadcastChannel | undefined;

    // The shared engine handles connecting, disconnecting and reconnecting. This adapter only opens the transport.
    const connection = createReconnectingConnection({
      bindings,
      autoConnect: true,
      open: (attempt) => {
        const current = new BroadcastChannel(attempt.connection.url);
        channel = current;
        current.onmessage = ({ data }: MessageEvent<Frame>) => {
          if (attempt.isCurrent()) {
            bindings.onEvent({ topic: data.topic, data: data.data, extra: undefined });
          }
        };
        // A channel is open as soon as it exists
        attempt.ready();
        return {
          close: () => {
            if (channel === current) channel = undefined;
            current.close();
          },
        };
      },
    });

    return {
      connect: connection.connect,
      reconnect: connection.reconnect,
      disconnect: connection.disconnect,
      dispose: connection.dispose,
      listen: (listener, callback) => bindings.onListen({ listener, callback }),
      emit: async (emitter) => {
        const prepared = await bindings.onEmit({ emitter });
        if (prepared) channel?.postMessage({ topic: prepared.topic, data: prepared.payload } satisfies Frame);
      },
    };
  });
