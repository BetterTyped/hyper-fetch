import { ClientInstance, stringifyValue } from "@hyper-fetch/core";

export const getEndpointAndMethod = (endpointString: string, method: string, client: ClientInstance) => {
  const endpoint = client.adapter.unstable_devtoolsEndpointGetter(endpointString);
  return `${method}-${endpoint}`;
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
          streamSize += new Blob([String(value)]).size;
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
        size += new Blob([value]).size;
      } else {
        size += new Blob([String(value)]).size;
      }
    }
  } else {
    size = new Blob([String(stringifyValue(data))]).size;
  }

  return toNumber(size);
};
