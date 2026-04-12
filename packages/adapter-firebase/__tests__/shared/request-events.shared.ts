import type { RequestInstance } from "@hyper-fetch/core";

export const testLifecycleEvents = async <R extends RequestInstance>(request: R) => {
  const spy1 = vi.fn();
  const spy2 = vi.fn();
  const spy3 = vi.fn();
  const spy4 = vi.fn();
  const spy5 = vi.fn();
  const spy6 = vi.fn();

  request.client.requestManager.events.onRequestStartByQueue(request.queryKey, spy1);
  request.client.requestManager.events.onResponseStartByQueue(request.queryKey, spy2);
  request.client.requestManager.events.onUploadProgressByQueue(request.queryKey, spy3);
  request.client.requestManager.events.onDownloadProgressByQueue(request.queryKey, spy4);
  request.client.requestManager.events.onResponseByCache(request.cacheKey, spy5);

  const response = (request as RequestInstance).send({
    onBeforeSent: ({ requestId }) => {
      request.client.requestManager.events.onResponseById(requestId, spy6);
    },
  });

  // eslint-disable-next-line no-promise-executor-return
  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(spy1).toHaveBeenCalledTimes(1);
  expect(spy2).toHaveBeenCalledTimes(1);
  expect(spy5).toHaveBeenCalledTimes(1);
  expect(spy6).toHaveBeenCalledTimes(1);

  return response;
};
