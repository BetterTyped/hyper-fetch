import { getSocketAdapterBindings } from "@hyper-fetch/sockets";
import { onSnapshot, Firestore, doc, query, collection } from "firebase/firestore";

import { getStatus, isDocOrQuery } from "utils";
import { mapConstraint, getGroupedResultFirestore, getOrderedResultFirestore } from "firestore";
import { FirestoreSocketAdapterType } from "adapter";

export const firestoreSockets = (database: Firestore): FirestoreSocketAdapterType => {
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

    const listen: ReturnType<FirestoreSocketAdapterType>["listen"] = (listener, callback) => {
      const fullUrl = socket.url + listener.endpoint;
      const { options } = listener;

      let path;
      const queryType = isDocOrQuery(fullUrl);
      if (queryType === "doc") {
        path = doc(database, fullUrl);
      } else {
        const queryConstraints = options?.constraints.map((constr) => mapConstraint(constr)) || [];
        path = query(collection(database, fullUrl), ...queryConstraints);
      }
      let unsubscribe = () => {};
      let unmount = () => {};
      let clearListeners = () => {};

      unsubscribe = onSnapshot(
        path,
        (snapshot) => {
          const response = queryType === "doc" ? snapshot.data() || null : getOrderedResultFirestore(snapshot);
          const status = getStatus(response);
          const groupedResult = options?.groupByChangeType === true ? getGroupedResultFirestore(snapshot) : null;
          const extra = { ref: path, snapshot, groupedResult, status };
          callback({ data: response, extra });
          onEvent(listener.endpoint, response, extra);
        },
        (error) => {
          onError(error);
        },
      );
      unmount = onListen(listener, callback, unsubscribe);
      clearListeners = () => {
        unsubscribe();
        unmount();
      };

      return clearListeners;
    };

    const emit = async () => {
      throw new Error("Cannot emit from Firestore database socket.");
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
