import { Database, DataSnapshot } from "firebase-admin/database";
import { SocketAdapter } from "@hyper-fetch/sockets";

import { applyRealtimeAdminConstraints, getOrderedResultRealtime } from "./utils";
import { getStatus, isDocOrQuery } from "utils";
import { RealtimeAdminOnValueMethodExtra, RealtimeAdminSocketAdapterType } from "adapter";

export const realtimeSocketsAdmin = (database: Database) => {
  return (
    new SocketAdapter({
      name: "firebase-admin-realtime",
      defaultConnected: true,
    }) as unknown as RealtimeAdminSocketAdapterType
  ).setConnector(
    ({ socket, onReconnect, onConnect, onConnected, onDisconnect, onDisconnected, onListen, onEvent, onError }) => {
      const connect = async () => {
        const enabled = onConnect();

        if (enabled) {
          database.goOnline();
          onConnected();
        }
      };

      const disconnect = async () => {
        database.goOffline();
        onDisconnect();
        onDisconnected();
      };

      const reconnect = () => {
        onReconnect({ disconnect, connect });
      };

      const listen: RealtimeAdminSocketAdapterType["listen"] = (listener, callback) => {
        const fullUrl = socket.url + listener.topic;
        const path = database.ref(fullUrl);
        const { options } = listener;
        const onlyOnce = options?.onlyOnce || false;
        const q = applyRealtimeAdminConstraints(path, options?.constraints || []);
        const method = onlyOnce === true ? "once" : "on";
        q[method](
          "value",
          (snapshot) => {
            const getSnapshotData = (s: DataSnapshot) => (s.val() ? { ...s.val(), __key: s.key } : null);
            const response =
              isDocOrQuery(fullUrl) === "doc" ? getSnapshotData(snapshot) : getOrderedResultRealtime(snapshot);
            const status = getStatus(response);
            const extra: RealtimeAdminOnValueMethodExtra = { ref: path, snapshot, status };
            callback({ data: response, extra });
            onEvent({ topic: listener.topic, data: response, extra });
          },
          (error) => {
            onError({ error });
          },
        );
        const unsubscribe = () => q.off("value");
        const unmount = onListen({ listener, callback, onUnmount: unsubscribe });

        const clearListeners = () => {
          unsubscribe();
          unmount();
        };

        return clearListeners;
      };

      const emit = async () => {
        throw new Error("Cannot emit from Realtime database socket.");
      };

      return {
        connect,
        reconnect,
        disconnect,
        listen,
        emit,
      };
    },
  );
};
