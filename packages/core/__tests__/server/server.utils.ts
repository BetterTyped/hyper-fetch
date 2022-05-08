import { DefaultRequestBody, PathParams, ResponseComposition, rest, RestContext, RestHandler, RestRequest } from "msw";

export const getInterceptEndpoint = (endpoint: string): RegExp => {
  return new RegExp(`^(?!.*\b${`${endpoint}/`}/\b).*${endpoint}.*`);
};

export const createStubMethod = (
  url: RegExp,
  method: string,
  status: number,
  response: Record<string, any>,
  delay?: number,
): RestHandler => {
  function callback(
    _req: RestRequest<DefaultRequestBody, PathParams>,
    res: ResponseComposition<any>,
    ctx: RestContext,
  ) {
    const args = [ctx.delay(), ctx.status(status), ctx.json(response || {})];

    if (delay === 0) {
      args.shift();
    }

    if (delay) {
      args.shift();
      args.unshift(ctx.delay(delay));
    }

    return res(...args);
  }

  if (method.toUpperCase() === "POST") {
    return rest.post(url, callback);
  }
  if (method.toUpperCase() === "PUT") {
    return rest.put(url, callback);
  }
  if (method.toUpperCase() === "PATCH") {
    return rest.patch(url, callback);
  }
  if (method.toUpperCase() === "DELETE") {
    return rest.delete(url, callback);
  }
  return rest.get(url, callback);
};
