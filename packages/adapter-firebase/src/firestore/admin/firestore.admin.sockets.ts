import { CollectionReference, DocumentReference, DocumentSnapshot, Firestore, Query } from "firebase-admin/firestore";
import { getSocketAdapterBindings } from "@hyper-fetch/sockets";

import { applyConstraints, getRef } from "./firestore.admin.utils";
import { getGroupedResultFirestore, getOrderedResultFirestore } from "../utils/firestore.utils";
import { getStatus } from "utils";
import { FirestoreAdminSocketAdapterType } from "../../adapter/types/firestore.admin.types";

export const firestoreAdminSockets = (database: Firestore): FirestoreAdminSocketAdapterType => {
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

    const listen: ReturnType<FirestoreAdminSocketAdapterType>["listen"] = (listener, callback) => {
      const fullUrl = socket.url + listener.name;
      const { options } = listener;
      let pathRef: DocumentReference | Query = getRef(database, fullUrl);
      if (pathRef instanceof CollectionReference) {
        pathRef = applyConstraints(pathRef, options?.constraints || []);
      }
      let unsubscribe = () => {};
      let unmount = () => {};
      let clearListeners = () => {};

      unsubscribe = pathRef.onSnapshot(
        (snapshot) => {
          const response =
            snapshot instanceof DocumentSnapshot ? snapshot.data() || null : getOrderedResultFirestore(snapshot);
          const status = getStatus(response);
          const groupedResult = options?.groupByChangeType === true ? getGroupedResultFirestore(snapshot) : null;
          const extra = { ref: pathRef, snapshot, unsubscribe, groupedResult, status };
          callback({ data: response, extra });
          onEvent(listener.name, response, extra);
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
