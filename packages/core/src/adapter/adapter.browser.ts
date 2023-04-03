import { getAdapterBindings, ResponseReturnType, BaseAdapterType } from "adapter";
import { RequestInstance } from "../request";
import { ExtractErrorType, ExtractResponseType } from "../types";
import { handleXhrRequest } from "./adapter.browser.request";
import { handleMockRequest } from "./adapter.mock.request";

export const adapter: BaseAdapterType = async <T extends RequestInstance>(request: T, requestId) => {
  const { requestWrapper, ...bindingsMethods } = await getAdapterBindings<T, BaseAdapterType>(
    request,
    requestId,
    0,
    {},
  );

  const { method = "GET" } = request;

  console.log("REQUEST MOCK", request.mock);
  return requestWrapper(
    () =>
      new Promise<ResponseReturnType<ExtractResponseType<T>, ExtractErrorType<T>, BaseAdapterType>>((resolve) => {
        if (!request.mock) {
          const xhr = handleXhrRequest(resolve, method, bindingsMethods);
          xhr.send();
        } else {
          handleMockRequest(resolve, request.mock, bindingsMethods);
        }
      }),
  );
};
