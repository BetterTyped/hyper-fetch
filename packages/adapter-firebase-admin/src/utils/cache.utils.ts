import { ClientInstance, RequestInstance } from "@hyper-fetch/core";

import { FirestoreAdapterType } from "adapter";

export const setCacheManually = (
  request: RequestInstance<{
    client: ClientInstance<{
      adapter: FirestoreAdapterType;
    }>;
  }>,
  response: { value: any; status: "success" | "error" | "emptyResource" },
  extra: any,
) => {
  if (["success", "emptyResource"].includes(response.status)) {
    request.client.cache.set(request, {
      data: response.value,
      status: "success",
      error: null,
      success: true,
      extra,
      isCanceled: false,
      isOffline: false,
      retries: 0,
      requestTimestamp: +new Date(),
      responseTimestamp: +new Date(),
      addedTimestamp: +new Date(),
      triggerTimestamp: +new Date(),
    });
  } else {
    request.client.cache.set(request, {
      data: null,
      status: "error" as const,
      error: response.value,
      success: false,
      extra,
      isCanceled: false,
      isOffline: false,
      retries: 0,
      requestTimestamp: +new Date(),
      responseTimestamp: +new Date(),
      addedTimestamp: +new Date(),
      triggerTimestamp: +new Date(),
    });
  }
};
