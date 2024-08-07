import { getSocketAdapterBindings } from "@hyper-fetch/sockets";
import {
  collection,
  disableNetwork,
  doc,
  enableNetwork,
  Firestore,
  onSnapshot,
  query,
  QuerySnapshot,
} from "firebase/firestore";
import { DocumentSnapshot } from "@firebase/firestore";

import { getStatus, isDocOrQuery } from "utils";
import { getGroupedResultFirestore, getOrderedResultFirestore, mapConstraint } from "./utils";
import { FirestoreSocketAdapterType } from "adapter";
import { FirestoreDocOrQuery, FirestoreSnapshotType } from "./firestore.types";
import { FirestorePermittedMethods } from "../constraints";

export const firestoreSockets = (database: Firestore): FirestoreSocketAdapterType => {
  return (socket) => {
    const {
      state,
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
    } = getSocketAdapterBindings(socket, { connected: true });

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

      let path: any;
      const queryType = isDocOrQuery(fullUrl);
      if (queryType === FirestoreDocOrQuery.DOC) {
        path = doc(database, fullUrl);
      } else {
        const constraints = options?.constraints || [];
        const queryConstraints = constraints.map((constr: FirestorePermittedMethods) => mapConstraint(constr)) || [];
        path = query(collection(database, fullUrl), ...queryConstraints);
      }
      let unsubscribe = () => {};
      let unmount = () => {};
      let clearListeners = () => {};

      unsubscribe = onSnapshot(
        path,
        (snapshot: FirestoreSnapshotType<typeof queryType>) => {
          const getDocData = (s: DocumentSnapshot) => (s.data() ? { ...s.data(), __key: s.id } : null);
          const response =
            queryType === FirestoreDocOrQuery.DOC
              ? getDocData(snapshot as DocumentSnapshot)
              : getOrderedResultFirestore(snapshot as QuerySnapshot);
          const status = getStatus(response);
          const groupedResult =
            options?.groupByChangeType === true ? getGroupedResultFirestore(snapshot as QuerySnapshot) : null;
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
      state,
      listeners,
      listen,
      removeListener,
      emit,
      connect,
      reconnect,
      disconnect,
    };
  };
};
