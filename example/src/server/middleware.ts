import { rest } from "msw";
import { setupServer } from "msw/node";
import { FetchBuilder } from "@better-typed/react-fetch";

export const middleware = new FetchBuilder({ baseUrl: "http://localhost:5555" }).build();

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

const server = setupServer();
server.listen();
// server.use(getMethod(url, method, status, mock));
