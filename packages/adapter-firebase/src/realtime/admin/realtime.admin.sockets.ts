import { Database } from "firebase-admin/lib/database";
import { getSocketAdapterBindings } from "@hyper-fetch/sockets";

import { applyConstraints } from "./realtime.admin.utils";
import { getOrderedResultRealtime, RealtimeAdminOnValueMethodExtra, RealtimeAdminSocketAdapterType } from "realtime";
import { getStatus, isDocOrQuery } from "utils";

export const realtimeSocketsAdmin = (database: Database): RealtimeAdminSocketAdapterType => {
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
    } = getSocketAdapterBindings(socket);

    const connect = () => {
      const enabled = onConnect();

      if (enabled) {
        database.goOnline();
        onOpen();
      }
    };

    const disconnect = () => {
      database.goOffline();
      onDisconnect();
      onClose();
    };

    const reconnect = () => {
      onReconnect(disconnect, connect);
    };

    const listen: ReturnType<RealtimeAdminSocketAdapterType>["listen"] = (listener, callback) => {
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
          const extra: RealtimeAdminOnValueMethodExtra = { ref: path, snapshot, status };
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

    // Lifecycle

    database?.ref?.(".info/connected").on("value", (snap) => {
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
