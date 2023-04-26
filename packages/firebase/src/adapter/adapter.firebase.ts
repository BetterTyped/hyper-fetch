import {
  ExtractAdapterType,
  ExtractErrorType,
  ExtractResponseType,
  getAdapterBindings,
  RequestInstance,
  ResponseReturnType,
} from "@hyper-fetch/core";
import { Database } from "firebase/database";

import { FirebaseAdapterTypes, FirebaseDBTypes } from "./adapter.types";
import { getRealtimeDBMethods } from "./methods/adapter.realtime";

// TODO - add pre and post validation for firebase

export const firebaseAdapter = <T extends FirebaseDBTypes>(database: T) => {
  const adapter: FirebaseAdapterTypes<T> = async <R extends RequestInstance>(request: R, requestId: string) => {
    const { fullUrl, onSuccess, onError } = await getAdapterBindings(request, requestId, 0, {});
    // TODO - any for data?
    const { method = "onValue", queryParams, data } = request;
    return new Promise<ResponseReturnType<ExtractResponseType<R>, ExtractErrorType<R>, ExtractAdapterType<R>>>(
      (resolve) => {
        // eslint-disable-next-line no-console
        if (database instanceof Database) {
          const availableMethods = getRealtimeDBMethods(request, database, fullUrl, onSuccess, onError, resolve);
          const selectedMethod = availableMethods[method];
          if (!selectedMethod) {
            // TODO THROW ERROR?
            console.log("Cannot find method");
          }
          selectedMethod({
            constraints: { filterBy: queryParams?.filterBy || [], orderBy: queryParams?.orderBy || null },
            data,
          });
        }
      },
    );
  };
  return adapter;
};
