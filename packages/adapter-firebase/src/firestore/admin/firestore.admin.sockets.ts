import { CollectionReference, DocumentReference, DocumentSnapshot, Firestore, Query } from "firebase-admin/firestore";
import { getSocketAdapterBindings } from "@hyper-fetch/sockets";

import { applyFireStoreAdminConstraints, getRef } from "./firestore.admin.utils";
import { getGroupedResultFirestore, getOrderedResultFirestore } from "../utils";
import { FirestoreAdminSocketAdapterType } from "../../adapter/admin/types";
import { getStatus } from "../../utils";

export const firestoreAdminSockets =
  (database: Firestore): FirestoreAdminSocketAdapterType =>
  (socket) => {
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
      const fullUrl = socket.url + listener.endpoint;
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
          const response =
            snapshot instanceof DocumentSnapshot ? snapshot.data() || null : getOrderedResultFirestore(snapshot);
          const status = getStatus(response);
          const groupedResult = options?.groupByChangeType === true ? getGroupedResultFirestore(snapshot) : null;
          const extra = { ref: pathRef, snapshot, unsubscribe, groupedResult, status };
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
