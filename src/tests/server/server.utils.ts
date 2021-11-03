import { rest } from "msw";

export const getInterceptEndpoint = (endpoint: string): RegExp => {
  return new RegExp(`^(?!.*\b${`${endpoint}/`}/\b).*${endpoint}.*`);
};

export const getMethod = (url: RegExp, method: string, status: number, response: Record<string, any>) => {
  function callback(_req: any, res: any, ctx: any) {
    return res(ctx.status(status), ctx.json(response || {}));
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
