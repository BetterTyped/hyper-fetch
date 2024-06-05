/* eslint-disable no-param-reassign */
/* eslint-disable max-params */
import { RequestInstance, getErrorMessage } from "@hyper-fetch/core";
import { HttpResponse, delay, graphql, GraphQLResponseResolver } from "msw";

import { getEndpointMockingRegex, getMockSetup } from "../http/http.mock";
import { MockRequestOptions } from "../http";

const getName = (endpoint: string) => {
  if (endpoint.includes("mutation")) {
    return endpoint.split("mutation ")[1].split("(")[0];
  }
  return endpoint.split("query ")[1].split("(")[0].split(" {")[0];
};

export const createMock = <Request extends RequestInstance, Status extends number>(
  request: Request,
  options: MockRequestOptions<Request, Status>,
) => {
  const { endpoint } = request;
  const url = getEndpointMockingRegex(endpoint);
  const name = getName(endpoint);

  const { status, delayTime, data } = getMockSetup(options, { gql: true });

  const requestResolver: GraphQLResponseResolver = async () => {
    if (delayTime) {
      await delay(delayTime);
    }

    const { requestManager } = request.client;
    const controllers = requestManager.abortControllers.get(request.abortKey);
    const size = controllers?.size || 0;
    const abortController = Array.from(controllers || [])[size - 1];
    const timeoutTime = request.options?.timeout ?? 5000;
    const shouldTimeout = timeoutTime < delayTime;

    if (abortController && abortController?.[1].signal.aborted) {
      const error = getErrorMessage("abort");
      return HttpResponse.json({ errors: [{ message: error.message }] }, { status: 0 });
    }
    if (shouldTimeout) {
      const error = getErrorMessage("timeout");
      return HttpResponse.json({ errors: [{ message: error.message }] }, { status: 500 });
    }

    return HttpResponse.json(data, { status });
  };

  graphql.link(url);

  if (endpoint.includes("mutation")) {
    return graphql.mutation(name, requestResolver);
  }
  return graphql.query(name, requestResolver);
};
