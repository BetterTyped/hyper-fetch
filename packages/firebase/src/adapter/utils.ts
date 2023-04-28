import { RequestInstance } from "@hyper-fetch/core";

export const setCacheManually = <R extends RequestInstance>(
  request: R,
  response: { value: any; status: "success" | "error" },
  additionalData,
) => {
  if (response.status === "success") {
    request.client.cache.set(request, {
      data: response.value,
      status: "success",
      error: null,
      isSuccess: true,
      additionalData,
      isCanceled: false,
      isOffline: false,
      retries: 0,
      timestamp: +new Date(),
    });
  } else {
    request.client.cache.set(request, {
      data: null,
      status: "error",
      error: response.value,
      isSuccess: false,
      additionalData,
      isCanceled: false,
      isOffline: false,
      retries: 0,
      timestamp: +new Date(),
    });
  }
};
