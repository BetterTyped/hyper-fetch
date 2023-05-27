import { ListenerCallbackType, ListenerInstance, SocketAdapterType, adapterBindingsSocket } from "@hyper-fetch/sockets";
import { onValue, query, Database, ref, goOffline, goOnline } from "firebase/database";

import { getOrderedResultRealtime, mapConstraint } from "realtime";
import { getStatus, isDocOrQuery } from "utils";

export const realtimeAdapter = (database: Database): SocketAdapterType => {
  return (socket) => {
    const {
      open,
      connecting,
      forceClosed,
      reconnectionAttempts,
      listeners,
      removeListener,
      onConnect,
      onReconnect,
      onDisconnect,
      onListen,
      onOpen,
      onClose,
      onEvent,
    } = adapterBindingsSocket(socket);

    const connect = () => {
      const enabled = onConnect();

      if (enabled) {
        goOnline(database);
        onOpen();
      }
    };

    const disconnect = () => {
      goOffline(database);
      onDisconnect();
      onClose();
    };

    const reconnect = () => {
      onReconnect(disconnect, connect);
    };

    const listen = (listener: ListenerInstance, callback: ListenerCallbackType<any, any>) => {
      const fullUrl = socket.url + listener.name;
      const path = ref(database, fullUrl);

      const { options } = listener;
      const onlyOnce = options?.onlyOnce || false;
      const params = options?.constraints.map((constraint) => mapConstraint(constraint)) || [];
      const queryConstraints = query(path, ...params);
      const unsubscribe = onValue(
        queryConstraints,
        (snapshot) => {
          const response = isDocOrQuery(fullUrl) === "doc" ? snapshot.val() : getOrderedResultRealtime(snapshot);
          const status = getStatus(response);
          const extra = { ref: path, snapshot, unsubscribe, status };
          callback({ data: response, extra });
          onEvent(listener.name, response, extra);
        },
        { onlyOnce },
      );
      const unmount = onListen(listener, callback, unsubscribe);

      return () => {
        unsubscribe();
        unmount();
      };
    };

    const emit = async () => {
      throw new Error("Cannot emit from Realtime database socket.");
    };

    // Lifecycle

    onValue(ref(database, ".info/connected"), (snap) => {
      if (snap.val() === false) {
        if (forceClosed) {
          reconnect();
        } else {
          connect();
        }
      }
    });

    return {
      open,
      reconnectionAttempts,
      listeners,
      connecting,
      listen,
      removeListener,
      emit,
      connect,
      reconnect,
      disconnect,
    };
  };
};
