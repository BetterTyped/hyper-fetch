import { ResponseComposition, ResponseTransformer, GraphQLRequest, graphql, GraphQLContext, GraphQLHandler } from "msw";
import { RequestInstance } from "@hyper-fetch/core";

export const getInterceptEndpoint = (endpoint: string): RegExp => {
  return new RegExp(`^(?!.*\b${`${endpoint}/`}/\b).*${endpoint}.*`);
};

const getResponse = (
  ctx: GraphQLContext<any>,
  request: RequestInstance,
  fixture: unknown,
  status: number,
  delay = 10,
) => {
  if (status >= 400 || status < 200) {
    if (!delay) {
      return [ctx.errors([fixture]), ctx.status(status)];
    }
    return [ctx.delay(delay), ctx.errors([fixture]), ctx.status(status)];
  }

  if (!delay) {
    return [ctx.data(fixture), ctx.status(status)];
  }
  return [ctx.delay(delay), ctx.data(fixture), ctx.status(status)];
};

const getName = (endpoint: string) => {
  if (endpoint.includes("mutation")) {
    return endpoint.split("mutation ")[1].split("(")[0];
  }
  return endpoint.split("query ")[1].split("(")[0].split(" {")[0];
};

export const createStubMethod = (
  request: RequestInstance,
  url: RegExp,
  endpoint: string,
  status: number,
  response: Record<string, any>,
  delay?: number,
): GraphQLHandler => {
  function callback(_req: GraphQLRequest<any>, res: ResponseComposition<any>, ctx: GraphQLContext<any>) {
    const args: ResponseTransformer<any, any>[] = getResponse(ctx, request, response, status, delay);

    if (delay === 0) {
      args.shift();
    }

    if (delay === null || delay === undefined) {
      args.unshift(ctx.delay());
    }

    if (delay) {
      args.unshift(ctx.delay(delay));
    }

    return res(...args);
  }

  const name = getName(endpoint);

  graphql.link(url);

  if (endpoint.includes("mutation")) {
    return graphql.mutation(name, callback);
  }
  return graphql.query(name, callback);
};
