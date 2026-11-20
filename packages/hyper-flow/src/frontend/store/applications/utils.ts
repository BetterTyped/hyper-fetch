import type { ClientInstance } from "@hyper-fetch/core";
import { stringifyValue } from "@hyper-fetch/core";

export const getEndpointAndMethod = (
  // api/users/:id
  request: { method: string; requestOptions: { endpoint: string } & Record<string, any> },
  client: ClientInstance,
) => {
  const { requestOptions, method } = request;
  const endpoint = client.adapter.unstable_devtoolsEndpointGetter(requestOptions.endpoint, requestOptions);
  return `${method}-${endpoint}`;
};

/** A ratio for display, `0` instead of `NaN` while there is nothing to divide, e.g. no requests yet */
export const toNumber = (value: number): number => {
  if (Number.isNaN(value)) {
    return 0;
  }
  return value;
};

/**
 * Bytes of a body as it travels between the application and HyperFlow. Bodies reach HyperFlow as JSON, so streams never
 * arrive here; blobs and form data are measured for callers that hold the original body.
 */
export const getDataSize = async (data: unknown): Promise<number> => {
  // No body was sent or received
  if (data === null || data === undefined) {
    return 0;
  }

  // Text bodies go over the wire as they are, without JSON quotes
  if (typeof data === "string") {
    return new Blob([data]).size;
  }

  if (data instanceof Blob) {
    return data.size;
  }

  if (data instanceof FormData) {
    let size = 0;
    data.forEach((value, key) => {
      // Form values are strings or files, and a file is a blob
      size += key.length + new Blob([value]).size;
    });
    return size;
  }

  return new Blob([stringifyValue(data)]).size;
};
