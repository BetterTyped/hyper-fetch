import { waitFor } from "@testing-library/react";
import { BuilderInstance } from "@better-typed/hyper-fetch";

export const testBuilderIsolation = async (builder: BuilderInstance) => {
  await waitFor(() => {
    expect(builder.fetchDispatcher.getAllRunningRequest()).toStrictEqual([]);
    expect(builder.submitDispatcher.getAllRunningRequest()).toStrictEqual([]);

    const cacheKeys = builder.cache.keys();
    expect(cacheKeys).toStrictEqual([]);
  });
};
