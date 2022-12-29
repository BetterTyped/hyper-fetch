import { waitFor } from "@testing-library/react";
import { ClientInstance } from "@hyper-fetch/core";

export const testClientIsolation = async (client: ClientInstance) => {
  await waitFor(() => {
    expect(client.fetchDispatcher.getAllRunningRequest()).toStrictEqual([]);
    expect(client.submitDispatcher.getAllRunningRequest()).toStrictEqual([]);

    const cacheKeys = client.cache.keys();
    expect(cacheKeys).toStrictEqual([]);
  });
};
