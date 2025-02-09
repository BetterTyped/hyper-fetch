import { sleep } from "@hyper-fetch/testing";

import { RequestInstance } from "request";
import { Adapter } from "adapter";
import { HttpAdapterType } from "http-adapter";
import { httpAdapterBrowserFetcher } from "../../src/http-adapter/http-adapter.browser.fetcher";

export const createAdapter = (props?: {
  sleepTime?: number;
  callback: (request: RequestInstance, requestId: string) => void;
}): HttpAdapterType => {
  const { sleepTime, callback } = props || {};

  const preFetchCall = async (args: any) => {
    if (sleepTime) {
      await sleep(sleepTime);
    }

    callback?.(args.request, args.requestId);
    return args;
  };
  const adapter = new Adapter({
    name: "test",
    defaultMethod: "GET",
    defaultExtra: {},
    systemErrorStatus: 0,
    systemErrorExtra: {},
  }).setFetcher((args) => {
    return preFetchCall(args).then(httpAdapterBrowserFetcher);
  });

  return adapter as unknown as HttpAdapterType;
};
