import {
  BaseAdapterType,
  ExtractErrorType,
  ExtractResponseType,
  getAdapterBindings,
  RequestInstance,
  ResponseReturnType,
} from "@hyper-fetch/core";

import { FirebaseAdapterType, FirebaseDBs } from "./adapter.types";

export const firebaseAdapter = (database: FirebaseDBs) => {
  const adapter: FirebaseAdapterType<typeof database> = async <R extends RequestInstance>(request: R, requestId) => {
    const { fullUrl } = await getAdapterBindings(request, requestId);
    return new Promise<ResponseReturnType<ExtractResponseType<R>, ExtractErrorType<R>, BaseAdapterType>>(() => {
      // eslint-disable-next-line no-console
      console.log(fullUrl);
    });
  };
  return adapter;
};
