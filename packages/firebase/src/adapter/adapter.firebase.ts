import {
  BaseAdapterType,
  ExtractErrorType,
  ExtractResponseType,
  getAdapterBindings,
  RequestInstance,
  ResponseReturnType,
} from "@hyper-fetch/core";
import { Database } from "firebase/database";

import { FirebaseAdapterType, FirebaseDBs } from "./adapter.types";
import { getRealtimeDBMethods } from "./methods/adapter.realtime";

const getQueryConstraints = (queryParams) => {
  const constraints = [];
  if (queryParams.filterBy) {
    constraints.push(...queryParams.filterBy);
  }
  if (queryParams.orderBy) {
    constraints.push(queryParams.orderBy);
  }

  return constraints;
};

export const firebaseAdapter = (database: FirebaseDBs) => {
  const adapter: FirebaseAdapterType<typeof database> = async <R extends RequestInstance>(request: R, requestId) => {
    const { fullUrl, onSuccess, onError } = await getAdapterBindings(request, requestId);
    const { method = "onValue", queryParams } = request;
    return new Promise<ResponseReturnType<ExtractResponseType<R>, ExtractErrorType<R>, BaseAdapterType>>((resolve) => {
      // eslint-disable-next-line no-console
      if (database instanceof Database) {
        const availableMethods = getRealtimeDBMethods(database, fullUrl, onSuccess, onError, resolve);
        const selectedMethod = availableMethods[method];
        selectedMethod({ constraints: getQueryConstraints(queryParams) });
      }
      // if (database instanceof Firestore) {
      // }
    });
  };
  return adapter;
};
