import {
  DefaultBodyType,
  MockedResponse,
  PathParams,
  ResponseComposition,
  ResponseTransformer,
  rest,
  RestContext,
  RestHandler,
  RestRequest,
} from "msw";

import { defaultTimeout, getErrorMessage } from "client";
import { CommandInstance } from "command";
import { sleep } from "../utils";

export const getInterceptEndpoint = (endpoint: string): RegExp => {
  return new RegExp(`^(?!.*\b${`${endpoint}/`}/\b).*${endpoint}.*`);
};

const getResponse = (ctx: RestContext, command: CommandInstance, fixture: unknown, status: number, delay = 10) => {
  const { commandManager } = command.builder;
  const controllers = commandManager.abortControllers.get(command.abortKey);
  const abortController = Array.from(controllers || [])[0];

  const timeoutTime = command.options?.timeout || defaultTimeout;
  const isTimeout = timeoutTime < delay;

  if (!delay) {
    return [ctx.json(fixture), ctx.status(status)];
  }

  return [
    async (response: MockedResponse<unknown>) => {
      await sleep(Math.min(timeoutTime, delay));
      if (abortController && abortController?.[1].signal.aborted) {
        ctx.status(500)(response);
        const error = getErrorMessage("abort");
        response.body = !command.builder.appManager.isNodeJs ? error : JSON.stringify({ message: error.message });
        return response;
      }
      if (isTimeout) {
        ctx.status(500)(response);
        const error = getErrorMessage("timeout");
        response.body = !command.builder.appManager.isNodeJs ? error : JSON.stringify({ message: error.message });
        return response;
      }
      ctx.json(fixture)(response);
      ctx.status(status)(response);
      return response;
    },
  ];
};

export const createStubMethod = (
  command: CommandInstance,
  url: RegExp,
  method: string,
  status: number,
  response: Record<string, any>,
  delay?: number,
): RestHandler => {
  function callback(_req: RestRequest<DefaultBodyType, PathParams>, res: ResponseComposition<any>, ctx: RestContext) {
    const args: ResponseTransformer<any, any>[] = getResponse(ctx, command, response, status, delay);

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

  switch (method.toUpperCase()) {
    case "POST":
      return rest.post(url, callback);
    case "PUT":
      return rest.put(url, callback);
    case "PATCH":
      return rest.patch(url, callback);
    case "DELETE":
      return rest.delete(url, callback);
    default:
      return rest.get(url, callback);
  }
};
