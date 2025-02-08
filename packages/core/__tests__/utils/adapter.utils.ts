import { sleep } from "@hyper-fetch/testing";

import { RequestInstance } from "request";
import { Adapter } from "adapter";
import { httpAdapter, HttpAdapterType } from "http-adapter";

export const createAdapter = (props?: {
  sleepTime?: number;
  callback: (request: RequestInstance, requestId: string) => void;
}): HttpAdapterType => {
  const { sleepTime, callback } = props || {};

  const adapter = new Adapter({
    name: "test",
    defaultMethod: "GET",
    defaultExtra: {},
    systemErrorStatus: 0,
    systemErrorExtra: {},
  }).setFetcher(async ({ request, requestId }) => {
    if (sleepTime) {
      await sleep(sleepTime);
    }

    callback?.(request, requestId);
    return httpAdapter.fetch(request as any, requestId);
  });

  return adapter as unknown as HttpAdapterType;
};
