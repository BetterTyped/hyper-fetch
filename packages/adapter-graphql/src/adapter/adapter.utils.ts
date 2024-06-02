import { RequestInstance, HttpMethods } from "@hyper-fetch/core";

export const getRequestValues = (request: RequestInstance) => {
  const { method } = request;

  const isPostRequest = request.method === HttpMethods.POST;

  const query = request.endpoint;
  const variables = request.data;

  const fullUrl = isPostRequest
    ? request.client.url
    : request.client.url + request.client.stringifyQueryParams({ query, variables });

  const payload = isPostRequest
    ? JSON.stringify({
        query,
        variables,
      })
    : null;

  return { fullUrl, payload, method };
};
