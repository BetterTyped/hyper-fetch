import { getSocketAdapterBindings } from "@hyper-fetch/sockets";
import { onValue, query, Database, ref, goOffline, goOnline } from "firebase/database";

import { getOrderedResultRealtime, mapConstraint } from "realtime";
import { getStatus, isDocOrQuery } from "utils";
import { RealtimeSocketAdapterType } from "adapter";

export const realtimeSockets = (database: Database): RealtimeSocketAdapterType => {
  return (socket) => {
    const {
      open,
      connecting,
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
      onError,
    } = getSocketAdapterBindings(socket, { open: true });

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

    const listen: ReturnType<RealtimeSocketAdapterType>["listen"] = (listener, callback) => {
      const fullUrl = socket.url + listener.endpoint;
      const path = ref(database, fullUrl);

      const { options } = listener;
      const onlyOnce = options?.onlyOnce || false;
      const params = options?.constraints?.map((constraint) => mapConstraint(constraint)) || [];
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
          onEvent(listener.endpoint, response, extra);
        },
        (error) => {
          onError(error);
        },
        { onlyOnce },
      );
      unmount = onListen(listener, callback, unsubscribe);
      clearListeners = () => {
        unsubscribe();
        unmount();
      };

      return clearListeners;
    };

    const emit = async () => {
      throw new Error("Cannot emit from Realtime database socket.");
    };

    // Lifecycle

    onValue(ref(database, ".info/connected"), (snap) => {
      if (snap.val() === false) {
        if (socket.options.autoConnect === true) {
          reconnect();
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
