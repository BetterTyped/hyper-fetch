import { CollectionReference, DocumentReference, DocumentSnapshot, Firestore, Query } from "firebase-admin/firestore";
import { getSocketAdapterBindings } from "@hyper-fetch/sockets";

import { getGroupedResultFirestore, getOrderedResultFirestore, getRef, applyFireStoreAdminConstraints } from "./utils";
import { getStatus } from "utils";
import { FirestoreAdminSocketAdapterType } from "adapter";

export const firestoreAdminSockets = (database: Firestore): FirestoreAdminSocketAdapterType => {
  return (socket) => {
    const {
      open,
      connecting,
      reconnectionAttempts,
      listeners,
      removeListener,
      onReconnect,
      onListen,
      onEvent,
      onError,
    } = getSocketAdapterBindings(socket, { open: true });

    const connect = () => {
      throw new Error("Connect function is not implemented for Firestore Admin socket.");
    };

    const disconnect = () => {
      throw new Error("Cannot disconnect from Firestore database socket. Use 'app.delete()' instead.");
    };

    const reconnect = () => {
      onReconnect(disconnect, connect);
    };

    const listen: ReturnType<FirestoreAdminSocketAdapterType>["listen"] = (listener, callback) => {
      const fullUrl = socket.url + listener.topic;
      const { options } = listener;
      let pathRef: DocumentReference | Query = getRef(database, fullUrl);
      if (pathRef instanceof CollectionReference) {
        pathRef = applyFireStoreAdminConstraints(pathRef, options?.constraints || []);
      }
      let unsubscribe = () => {};
      let unmount = () => {};
      let clearListeners = () => {};

      unsubscribe = pathRef.onSnapshot(
        (snapshot) => {
          const getSnapshotData = (s) => (s.data() ? { ...s.data(), __key: s.id } : null);
          const response =
            snapshot instanceof DocumentSnapshot ? getSnapshotData(snapshot) : getOrderedResultFirestore(snapshot);
          const status = getStatus(response);
          const groupedResult = options?.groupByChangeType === true ? getGroupedResultFirestore(snapshot) : null;
          const extra = { ref: pathRef, snapshot, unsubscribe, groupedResult, status };
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
