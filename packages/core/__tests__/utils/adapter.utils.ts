import { sleep } from "@hyper-fetch/testing";

import { RequestInstance } from "request";
import { Adapter } from "adapter";
import { HttpAdapter, HttpAdapterType } from "http-adapter";
import { LoggerManager } from "managers";

export const createAdapter = (props?: {
  sleepTime?: number;
  callback: (request: RequestInstance, requestId: string) => void;
}): HttpAdapterType => {
  const { sleepTime, callback } = props || {};

  const httpAdapter = HttpAdapter();

  const adapter = new Adapter({
    name: "test",
    defaultMethod: "GET",
    defaultExtra: {},
    systemErrorStatus: 0,
    systemErrorExtra: {},
  });

  adapter.logger = new LoggerManager().initialize({ debug: false }, "Adapter");
  httpAdapter.logger = new LoggerManager().initialize({ debug: false }, "Adapter");

  adapter.unstable_fetcher = httpAdapter.unstable_fetcher as any;
  adapter.fetch = async (request, requestId) => {
    if (sleepTime) {
      await sleep(sleepTime);
    }

    callback?.(request, requestId);
    return httpAdapter.fetch(request as any, requestId);
  };

  return httpAdapter as unknown as HttpAdapterType;
};
