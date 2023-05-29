import { RequestInstance, HttpMethodsEnum } from "@hyper-fetch/core";
import { print } from "graphql/language/printer";

// Requests

export const getRequestValues = (request: RequestInstance) => {
  const method = request.method || HttpMethodsEnum.post;
  const isPostRequest = method === HttpMethodsEnum.post;
  const query = typeof request.endpoint === "string" ? request.endpoint : print(request.endpoint);

  const fullUrl = isPostRequest
    ? request.client.url
    : request.client.url + request.client.stringifyQueryParams({ query, variables: request.data });

  const payload = isPostRequest
    ? JSON.stringify({
        query: request.endpoint,
        variables: request.data,
      })
    : null;

  return { fullUrl, payload, method };
};
