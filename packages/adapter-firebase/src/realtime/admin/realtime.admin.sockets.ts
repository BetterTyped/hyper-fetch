import { Database } from "firebase-admin/lib/database";
import { getSocketAdapterBindings } from "@hyper-fetch/sockets";

import { applyConstraints } from "./realtime.admin.utils";
import { getOrderedResultRealtime } from "realtime";
import { getStatus, isDocOrQuery } from "utils";
import { RealtimeSocketAdapterType } from "adapter";

export const realtimeSocketsAdmin = (database: Database): RealtimeSocketAdapterType => {
  return (socket) => {
    const {
      open,
      connecting,
      // forceClosed,
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
    } = getSocketAdapterBindings(socket);

    const connect = () => {
      const enabled = onConnect();

      if (enabled) {
        // goOnline(database);
        onOpen();
      }
    };

    const disconnect = () => {
      // goOffline(database);
      onDisconnect();
      onClose();
    };

    const reconnect = () => {
      onReconnect(disconnect, connect);
    };

    const listen: ReturnType<RealtimeSocketAdapterType>["listen"] = (listener, callback) => {
      const fullUrl = socket.url + listener.name;
      const path = database.ref(fullUrl);
      const { options } = listener;
      const onlyOnce = options?.onlyOnce || false;
      const q = applyConstraints(path, options?.constraints || []);
      const method = onlyOnce === true ? "once" : "on";
      q[method](
        "value",
        (snapshot) => {
          const response = isDocOrQuery(fullUrl) === "doc" ? snapshot.val() : getOrderedResultRealtime(snapshot);
          const status = getStatus(response);
          // TODO fix types
          const extra = { ref: path, snapshot, status } as any;
          callback({ data: response, extra });
          onEvent(listener.name, response, extra);
        },
        (error) => {
          onError(error);
        },
      );
      const unsubscribe = () => q.off("value");
      const unmount = onListen(listener, callback, unsubscribe);

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
