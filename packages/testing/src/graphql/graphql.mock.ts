/* eslint-disable no-param-reassign */
/* eslint-disable max-params */
import { RequestInstance, getErrorMessage } from "@hyper-fetch/core";
import { HttpResponse, delay, graphql, GraphQLResponseResolver } from "msw";

import { getMockSetup } from "../http/http.mock";
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

  const name = getName(endpoint);

  const { status, delayTime, data } = getMockSetup(options, { gql: true });

  const requestResolver: GraphQLResponseResolver = async () => {
    if (delayTime) {
      await delay(delayTime);
    }

    const timeoutTime = (request.options as any)?.timeout ?? 5000;
    const shouldTimeout = timeoutTime < delayTime;

    if (shouldTimeout) {
      const error = getErrorMessage("timeout");
      return HttpResponse.json({ errors: [{ message: error.message }] }, { status: 500 });
    }

    return HttpResponse.json(data, { status });
  };

  const link = graphql.link(request.client.url);

  if (endpoint.includes("mutation")) {
    return link.mutation(name, requestResolver);
  }
  return link.query(name, requestResolver);
};
