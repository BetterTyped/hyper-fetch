import { ClientRequestArgs } from "http";

import { getAdapterBindings, ResponseReturnType, BaseAdapterType } from "adapter";
import { RequestInstance } from "request";
import { ExtractErrorType, ExtractResponseType } from "types";
import { handleServerRequest } from "./adapter.server.request";
import { handleMockRequest } from "./adapter.mock.request";

export const adapter: BaseAdapterType<ClientRequestArgs> = async <T extends RequestInstance>(
  request: T,
  requestId: string,
) => {
  const { requestWrapper, ...bindings } = await getAdapterBindings(request, requestId, 0, {});

  return requestWrapper(
    () =>
      new Promise<ResponseReturnType<ExtractResponseType<T>, ExtractErrorType<T>, BaseAdapterType>>((resolve) => {
        if (!request.mock) {
          const handler = handleServerRequest(request, resolve, bindings);
          handler();
        } else {
          handleMockRequest(resolve, request, bindings);
        }
      }),
  );
};
