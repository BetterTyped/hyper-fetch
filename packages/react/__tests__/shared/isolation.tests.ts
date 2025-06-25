import { waitFor } from "@testing-library/react";
import { ClientInstance } from "@hyper-fetch/core";

export const testClientIsolation = async (client: ClientInstance) => {
  await waitFor(() => {
    expect(client.fetchDispatcher.getAllRunningRequests()).toStrictEqual([]);
    expect(client.submitDispatcher.getAllRunningRequests()).toStrictEqual([]);

    const cacheKeys = client.cache.keys();
    expect(cacheKeys).toStrictEqual([]);
  });
};
