import { Database } from "firebase-admin/lib/database";
import { getSocketAdapterBindings } from "@hyper-fetch/sockets";

import { applyRealtimeAdminConstraints, getOrderedResultRealtime } from "./utils";
import { getStatus, isDocOrQuery } from "utils";
import { RealtimeAdminOnValueMethodExtra, RealtimeAdminSocketAdapterType } from "adapter";

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
    } = getSocketAdapterBindings(socket, { open: true });

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
      const fullUrl = socket.url + listener.endpoint;
      const path = database.ref(fullUrl);
      const { options } = listener;
      const onlyOnce = options?.onlyOnce || false;
      const q = applyRealtimeAdminConstraints(path, options?.constraints || []);
      const method = onlyOnce === true ? "once" : "on";
      q[method](
        "value",
        (snapshot) => {
          const getSnapshotData = (s) => (s.val() ? { ...s.val(), __key: s.key } : null);
          const response =
            isDocOrQuery(fullUrl) === "doc" ? getSnapshotData(snapshot) : getOrderedResultRealtime(snapshot);
          const status = getStatus(response);
          const extra: RealtimeAdminOnValueMethodExtra = { ref: path, snapshot, status };
          callback({ data: response, extra });
          onEvent(listener.endpoint, response, extra);
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
