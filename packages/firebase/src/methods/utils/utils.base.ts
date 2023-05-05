import { RequestInstance } from "@hyper-fetch/core";

export const getStatus = (res: any) => {
  // Deliberate == instead of ===
  return (Array.isArray(res) && res.length === 0) || res == null ? "emptyResource" : "success";
};

export const isDocOrQuery = (fullUrl: string): string => {
  const withoutSurroundingSlashes = fullUrl.replace(/^\/|\/$/g, "");
  const pathElements = withoutSurroundingSlashes.split("/").length;
  return pathElements % 2 === 0 ? "doc" : "query";
};

export const setCacheManually = <R extends RequestInstance>(
  request: R,
  response: { value: any; status: "success" | "error" | "emptyResource" },
  additionalData,
) => {
  if (["success", "emptyResource"].includes(response.status)) {
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
