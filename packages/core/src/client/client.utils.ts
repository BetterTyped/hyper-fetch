import type { ResponseType } from "adapter";
import type { RequestInstance } from "request";
import type { ExtendRequest, ExtractClientAdapterType } from "types";

import type {
  ClientInstance,
  ClientMode,
  ClientModeOption,
  RequestInterceptorType,
  ResponseInterceptorType,
} from "./client.types";

/**
 * Picks effective {@link ClientMode}: explicit override, else environment detection.
 *
 * Auto mode picks `"client"` in runtimes that serve one user: a browser, React Native and every Electron process.
 * Anything else, like Node.js, Deno, Bun or an edge runtime, may serve many users and gets `"server"`.
 */
export function resolveClientMode(modeOption: ClientModeOption | undefined): ClientMode {
  if (modeOption === "client" || modeOption === "server") {
    return modeOption;
  }

  const inBrowser = typeof window !== "undefined" && typeof document !== "undefined";
  // React Native has a window but no document, and marks itself on navigator.product
  const inReactNative = typeof navigator !== "undefined" && navigator.product === "ReactNative";
  // The Electron main process has neither window nor document, but it is one desktop user's app
  const inElectron = typeof process !== "undefined" && !!process.versions?.electron;

  if (inBrowser || inReactNative || inElectron) {
    return "client";
  }

  return "server";
}

export const interceptRequest = async (interceptors: RequestInterceptorType[], request: RequestInstance) => {
  let newRequest = request;
  if (!request.requestOptions.disableRequestInterceptors) {
    // eslint-disable-next-line no-restricted-syntax
    for (const interceptor of interceptors) {
      // Interceptors create a pipeline - each one receives the request returned by the previous one
      // eslint-disable-next-line no-await-in-loop
      newRequest = (await interceptor(newRequest)) as RequestInstance;
      if (!newRequest) {
        throw new Error("Request modifier must return request");
      }
    }
  }
  return newRequest;
};

export const interceptResponse = async <GlobalErrorType, Client extends ClientInstance>(
  interceptors: ResponseInterceptorType<Client>[],
  response: ResponseType<any, GlobalErrorType, ExtractClientAdapterType<Client>>,
  request: ExtendRequest<RequestInstance, { client: Client }>,
) => {
  let newResponse = response;
  if (!request.requestOptions.disableResponseInterceptors) {
    // eslint-disable-next-line no-restricted-syntax
    for (const interceptor of interceptors) {
      // Interceptors create a pipeline - each one receives the response returned by the previous one
      // eslint-disable-next-line no-await-in-loop
      newResponse = await interceptor(newResponse, request);
      if (!newResponse) {
        throw new Error("Response modifier must return data");
      }
    }
  }
  return newResponse;
};
