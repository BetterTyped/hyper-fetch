import { RequestInstance } from "@hyper-fetch/core";
import { waitFor } from "@testing-library/dom";

export const testLifecycleEvents = async (request: RequestInstance) => {
  const spy1 = jest.fn();
  const spy2 = jest.fn();
  const spy3 = jest.fn();
  const spy4 = jest.fn();
  const spy5 = jest.fn();
  const spy6 = jest.fn();

  request.client.requestManager.events.onRequestStart(request.queueKey, spy1);
  request.client.requestManager.events.onResponseStart(request.queueKey, spy2);
  request.client.requestManager.events.onUploadProgress(request.queueKey, spy3);
  request.client.requestManager.events.onDownloadProgress(request.queueKey, spy4);
  request.client.requestManager.events.onResponse(request.cacheKey, spy5);

  request.send({
    onSettle: (requestId) => {
      request.client.requestManager.events.onResponseById(requestId, spy6);
    },
  });

  await waitFor(() => {
    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(1);
    expect(spy3).toBeCalledTimes(2);
    expect(spy4).toBeCalledTimes(2);
    expect(spy5).toBeCalledTimes(1);
    expect(spy6).toBeCalledTimes(1);
  });
};
