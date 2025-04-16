import { ClientInstance, RequestInstance, RequestJSON, stringifyValue } from "@hyper-fetch/core";

export const getEndpointAndMethod = (request: RequestJSON<RequestInstance>, client: ClientInstance) => {
  const endpoint = client.adapter.unsafe_devtoolsEndpointGetter(request as unknown as RequestInstance);
  return `${request.method}-${endpoint}`;
};

export const toNumber = (value: number): number => {
  if (Number.isNaN(value)) {
    return 0;
  }
  return value;
};

export const getDataSize = async (data: unknown): Promise<number> => {
  let size = 0;

  // Handle streams and blob-like objects
  if (data instanceof ReadableStream) {
    let streamSize = 0;
    try {
      const reader = data.getReader();

      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const { done, value } = await reader.read();
        if (done) break;

        // For Uint8Array or similar buffer types
        if (value && value.byteLength) {
          streamSize += value.byteLength;
        } else if (value) {
          // Fallback for other value types
          streamSize += String(value).length;
        }
      }
    } catch (error) {
      // Handle potential stream errors silently
    }

    return toNumber(streamSize);
  }

  if (data instanceof Blob) {
    size = data.size;
    return toNumber(size);
  }

  if (data instanceof FormData) {
    // Calculate FormData size by iterating through entries
    // eslint-disable-next-line no-restricted-syntax
    for (const pair of data.entries()) {
      size += pair[0].length;

      const value = pair[1];
      if (value instanceof File) {
        size += value.size;
      } else if (typeof value === "string") {
        size += value.length;
      } else {
        size += String(value).length;
      }
    }
  } else {
    size = String(stringifyValue(data)).length;
  }

  return toNumber(size);
};
