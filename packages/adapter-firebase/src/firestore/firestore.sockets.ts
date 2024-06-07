import { getSocketAdapterBindings } from "@hyper-fetch/sockets";
import { onSnapshot, Firestore, doc, query, collection, disableNetwork, enableNetwork } from "firebase/firestore";

import { getStatus, isDocOrQuery } from "utils";
import { mapConstraint, getGroupedResultFirestore, getOrderedResultFirestore } from "./utils";
import { FirestoreSocketAdapterType } from "adapter";

export const firestoreSockets = (database: Firestore): FirestoreSocketAdapterType => {
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
      onConnected,
      onDisconnected,
      onEvent,
      onError,
    } = getSocketAdapterBindings(socket, { open: true });

    const connect = () => {
      const enabled = onConnect();

      if (enabled) {
        enableNetwork(database);
        onConnected();
      }
    };

    const disconnect = () => {
      disableNetwork(database);
      onDisconnect();
      onDisconnected();
    };

    const reconnect = () => {
      onReconnect(disconnect, connect);
    };

    const listen: ReturnType<FirestoreSocketAdapterType>["listen"] = (listener, callback) => {
      const fullUrl = socket.url + listener.topic;
      const { options } = listener;

      let path;
      const queryType = isDocOrQuery(fullUrl);
      if (queryType === "doc") {
        path = doc(database, fullUrl);
      } else {
        const constraints = options?.constraints || [];
        const queryConstraints = constraints.map((constr) => mapConstraint(constr)) || [];
        path = query(collection(database, fullUrl), ...queryConstraints);
      }
      let unsubscribe = () => {};
      let unmount = () => {};
      let clearListeners = () => {};

      unsubscribe = onSnapshot(
        path,
        (snapshot) => {
          const getDocData = (s) => (s.data() ? { ...s.data(), __key: s.id } : null);
          const response = queryType === "doc" ? getDocData(snapshot) : getOrderedResultFirestore(snapshot);
          const status = getStatus(response);
          const groupedResult = options?.groupByChangeType === true ? getGroupedResultFirestore(snapshot) : null;
          const extra = { ref: path, snapshot, groupedResult, status };
          callback({ data: response, extra });
          onEvent(listener.topic, response, extra);
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
