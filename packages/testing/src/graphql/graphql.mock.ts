/* eslint-disable no-param-reassign */
/* eslint-disable max-params */
import type { RequestInstance } from "@hyper-fetch/core";
import { getErrorMessage } from "@hyper-fetch/core";
import type { GraphQLResponseResolver } from "msw";
import { HttpResponse, delay, graphql } from "msw";

import type { MockRequestOptions } from "../http";
import { getMockSetup } from "../http/http.mock";

// Structural type of the DocumentNode - graphql is not a dependency of this package
type GraphqlDocument =
  | string
  | { definitions: readonly { kind: string; operation?: string; name?: { value: string } }[] };

const isMutation = (document: GraphqlDocument) => {
  if (typeof document === "string") {
    return document.includes("mutation");
  }
  return document.definitions.some((def) => def.kind === "OperationDefinition" && def.operation === "mutation");
};

const getName = (document: GraphqlDocument) => {
  if (typeof document !== "string") {
    const operation = document.definitions.find((def) => def.kind === "OperationDefinition");
    return operation?.name?.value as string;
  }
  if (document.includes("mutation")) {
    return document.split("mutation ")[1].split("(")[0];
  }
  return document.split("query ")[1].split("(")[0].split(" {")[0];
};

export const createMock = <Request extends RequestInstance, Status extends number>(
  request: Request,
  options: MockRequestOptions<Request, Status>,
) => {
  // With the `document` option, the endpoint is a URL path and the document holds the operation
  const { document } = request.requestOptions as { document?: GraphqlDocument };
  const operation = document ?? request.endpoint;
  const url = document == null ? request.client.url : `${request.client.url}${request.endpoint}`;

  const name = getName(operation);

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

  const link = graphql.link(url);

  if (isMutation(operation)) {
    return link.mutation(name, requestResolver);
  }
  return link.query(name, requestResolver);
};
