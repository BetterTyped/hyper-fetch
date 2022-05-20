import {
  DefaultRequestBody,
  MockedResponse,
  PathParams,
  ResponseComposition,
  ResponseTransformer,
  rest,
  RestContext,
  RestHandler,
  RestRequest,
} from "msw";

import { defaultTimeout, getErrorMessage, FetchCommandInstance } from "@better-typed/hyper-fetch";
import { sleep } from "../utils";

export const getInterceptEndpoint = (endpoint: string): RegExp => {
  return new RegExp(`^(?!.*\b${`${endpoint}/`}/\b).*${endpoint}.*`);
};

const getResponse = (ctx: RestContext, command: FetchCommandInstance, fixture: unknown, status: number, delay = 10) => {
  const { commandManager } = command.builder;
  const controllers = commandManager.abortControllers.get(command.abortKey);
  const abortController = Array.from(controllers || [])[0];

  const timeoutTime = command.options?.timeout || command.builder?.requestConfig?.timeout || defaultTimeout;
  const isTimeout = timeoutTime < delay;

  if (!delay) {
    return [ctx.json(fixture), ctx.status(status)];
  }

  return [
    async (response: MockedResponse<unknown>) => {
      await sleep(Math.min(timeoutTime, delay));
      if (abortController && abortController?.[1]?.signal?.aborted) {
        ctx.status(500)(response);
        response.body = getErrorMessage("abort");
        return response;
      }
      if (isTimeout) {
        ctx.status(500)(response);
        response.body = getErrorMessage("timeout");
        return response;
      }
      ctx.json(fixture)(response);
      ctx.status(status)(response);
      return response;
    },
  ];
};

export const createStubMethod = (
  command: FetchCommandInstance,
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
