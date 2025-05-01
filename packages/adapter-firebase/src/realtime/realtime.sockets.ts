import { SocketAdapter } from "@hyper-fetch/sockets";
import { onValue, query, Database, ref, goOffline, goOnline } from "firebase/database";

import { getOrderedResultRealtime, mapRealtimeConstraint, getStatus, isDocOrQuery } from "./utils";
import { RealtimeDbOnValueMethodExtra, RealtimeDBQueryParams, RealtimeSocketAdapterType } from "adapter";
import { RealtimePermittedMethods } from "../constraints";

export const realtimeSockets = (database: Database): RealtimeSocketAdapterType => {
  return new SocketAdapter<RealtimeDbOnValueMethodExtra, undefined, { onlyOnce?: boolean } & RealtimeDBQueryParams>({
    name: "firebase-realtime",
    defaultConnected: true,
  }).setConnector(
    ({ socket, onConnect, onReconnect, onDisconnect, onListen, onConnected, onDisconnected, onEvent, onError }) => {
      const connect = async () => {
        const enabled = onConnect();

        if (enabled) {
          goOnline(database);
          onConnected();
        }
      };

      const disconnect = async () => {
        goOffline(database);
        onDisconnect();
        onDisconnected();
      };

      const reconnect = () => {
        onReconnect({ disconnect, connect });
      };

      const listen: RealtimeSocketAdapterType["listen"] = (listener, callback) => {
        const fullUrl = socket.url + listener.topic;
        const path = ref(database, fullUrl);

        const { options } = listener;
        const onlyOnce = options?.onlyOnce || false;
        const params =
          options?.constraints?.map((constraint: RealtimePermittedMethods) => mapRealtimeConstraint(constraint)) || [];
        const queryConstraints = query(path, ...params);
        let unsubscribe = () => {};
        let unmount = () => {};
        let clearListeners = () => {};
        unsubscribe = onValue(
          queryConstraints,
          (snapshot) => {
            const response = isDocOrQuery(fullUrl) === "doc" ? snapshot.val() : getOrderedResultRealtime(snapshot);
            const status = getStatus(response);
            const extra = { ref: path, snapshot, status };
            callback({ data: response, extra });
            onEvent({ topic: listener.topic, data: response, extra });
          },
          (error) => {
            onError({ error });
          },
          { onlyOnce },
        );
        unmount = onListen({ listener, callback, onUnmount: unsubscribe });
        clearListeners = () => {
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
