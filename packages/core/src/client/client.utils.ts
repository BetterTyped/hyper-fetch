import { ResponseType } from "adapter";
import { RequestInstance } from "request";
import { ExtendRequest, ExtractClientAdapterType } from "types";
import { ClientInstance, RequestInterceptorType, ResponseInterceptorType } from "./client.types";

export const interceptRequest = async (interceptors: RequestInterceptorType[], request: RequestInstance) => {
  let newRequest = request;
  if (!request.requestOptions.disableRequestInterceptors) {
    // eslint-disable-next-line no-restricted-syntax
    for (const interceptor of interceptors) {
      // eslint-disable-next-line no-await-in-loop
      newRequest = (await interceptor(request)) as RequestInstance;
      if (!newRequest) throw new Error("Request modifier must return request");
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
      // eslint-disable-next-line no-await-in-loop
      newResponse = await interceptor(response, request);
      if (!newResponse) throw new Error("Response modifier must return data");
    }
  }
  return newResponse;
};
