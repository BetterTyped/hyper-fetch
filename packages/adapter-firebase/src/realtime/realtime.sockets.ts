import type { DefaultMapperType } from "@hyper-fetch/core";
import { SocketAdapter } from "@hyper-fetch/sockets";
import type {
  RealtimeDbOnValueMethodExtra,
  RealtimeDBListenerOptions,
  RealtimeDBListenerQueryParams,
  RealtimeSocketAdapterType,
} from "adapter";
import type { Database } from "firebase/database";
import { onValue, query, ref, goOffline, goOnline } from "firebase/database";
import { getStatus, isDocOrQuery } from "utils";

import type { RealtimePermittedMethods } from "../constraints";
import { createRealtimeConstraints, getConstraints, resolveConstraints } from "../constraints";
import { getOrderedResultRealtime, mapRealtimeConstraint } from "./utils";

export const realtimeSockets = (database: Database): RealtimeSocketAdapterType => {
  return new SocketAdapter<
    RealtimeDbOnValueMethodExtra,
    undefined,
    RealtimeDBListenerOptions,
    undefined,
    undefined,
    DefaultMapperType,
    RealtimeDBListenerQueryParams
  >({
    name: "firebase-realtime",
    defaultConnected: true,
  })
    .setListenerQueryParamsResolver(resolveConstraints(createRealtimeConstraints))
    .setConnector(
      ({ socket, onConnect, onReconnect, onDisconnect, onListen, onConnected, onDisconnected, onEvent, onError }) => {
        const connect = async () => {
          const connection = await onConnect();

          if (connection) {
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
            // `options.constraints` is the deprecated place for constraints, kept working in v10
            getConstraints<RealtimePermittedMethods>(listener.queryParams ?? options?.constraints).map((constraint) =>
              mapRealtimeConstraint(constraint),
            );
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
