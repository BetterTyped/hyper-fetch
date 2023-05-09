import { RequestInstance } from "@hyper-fetch/core";
import { waitFor } from "@testing-library/dom";

export const testCacheEvents = async (request: RequestInstance) => {
  const spy1 = jest.fn();

  request.client.cache.events.onData(request.cacheKey, spy1);

  request.send({});

  await waitFor(() => {
    expect(spy1).toBeCalledTimes(1);
  });
};
