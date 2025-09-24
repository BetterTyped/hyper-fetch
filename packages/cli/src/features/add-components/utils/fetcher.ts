import { z } from "zod";
import { HttpsProxyAgent } from "https-proxy-agent";
import { promises as fs } from "fs";
import { homedir } from "os";
import path from "path";

import { resolveRegistryUrl } from "./builder";
import { getRegistryHeadersFromContext } from "./context";
import {
  RegistryFetchError,
  RegistryForbiddenError,
  RegistryLocalFileError,
  RegistryNotFoundError,
  RegistryParseError,
  RegistryUnauthorizedError,
} from "utils/errors";
import { registryItemSchema } from "features/schema/schema";
import { createClient } from "@hyper-fetch/core";

const registryCache = new Map<string, Promise<any>>();

export function clearRegistryCache() {
  registryCache.clear();
}

const client = createClient({ url: "" });

export async function fetchRegistry(paths: string[], options: { useCache?: boolean } = {}) {
  options = {
    useCache: true,
    ...options,
  };

  try {
    const results = await Promise.all(
      paths.map(async (path) => {
        const request = client.createRequest<{ response: Record<string, unknown> }>()({
          endpoint: resolveRegistryUrl(path),
        });

        // Check cache first if caching is enabled
        if (options.useCache && request.read()?.data) {
          return request.read()?.data;
        }

        // Store the promise in the cache before awaiting if caching is enabled.
        const fetchPromise = (async () => {
          // Get headers from context for this URL.
          const headers = getRegistryHeadersFromContext(request.endpoint);

          const { data, error, status, extra } = await request.setHeaders(headers).send();

          if (error) {
            let messageFromServer = undefined;

            if (extra?.headers["content-type"]?.includes("application/json")) {
              const parsed = z
                .object({
                  // RFC 7807.
                  detail: z.string().optional(),
                  title: z.string().optional(),
                  // Standard error response.
                  message: z.string().optional(),
                  error: z.string().optional(),
                })
                .safeParse(data);

              if (parsed.success) {
                // Prefer RFC 7807 detail field, then message field.
                messageFromServer = parsed.data.detail || parsed.data.message;

                if (parsed.data.error) {
                  messageFromServer = `[${parsed.data.error}] ${messageFromServer}`;
                }
              }
            }

            if (status === 401) {
              throw new RegistryUnauthorizedError(request.endpoint, messageFromServer);
            }

            if (status === 404) {
              throw new RegistryNotFoundError(request.endpoint, messageFromServer);
            }

            if (status === 403) {
              throw new RegistryForbiddenError(request.endpoint, messageFromServer);
            }

            throw new RegistryFetchError(request.endpoint, status || 0, messageFromServer);
          }

          return data;
        })();

        return fetchPromise;
      }),
    );

    return results;
  } catch (error) {
    throw error;
  }
}

export async function fetchRegistryLocal(filePath: string) {
  try {
    // Handle tilde expansion for home directory
    let expandedPath = filePath;
    if (filePath.startsWith("~/")) {
      expandedPath = path.join(homedir(), filePath.slice(2));
    }

    const resolvedPath = path.resolve(expandedPath);
    const content = await fs.readFile(resolvedPath, "utf8");
    const parsed = JSON.parse(content);

    try {
      return registryItemSchema.parse(parsed);
    } catch (error) {
      throw new RegistryParseError(filePath, error);
    }
  } catch (error) {
    // Check if this is a file not found error
    if (error instanceof Error && (error.message.includes("ENOENT") || error.message.includes("no such file"))) {
      throw new RegistryLocalFileError(filePath, error);
    }
    // Re-throw parse errors as-is
    if (error instanceof RegistryParseError) {
      throw error;
    }
    // For other errors (like JSON parse errors), throw as local file error
    throw new RegistryLocalFileError(filePath, error);
  }
}
