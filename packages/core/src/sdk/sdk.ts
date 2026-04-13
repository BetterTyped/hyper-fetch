import type { ClientInstance } from "client";
import type { RequestInstance } from "request";
import type { ExtractEndpointType } from "types";

export type RecursiveSchemaType = Record<
  string, // for example users / $userId / posts / $postId
  any
>;

/**
 * Per-request defaults that can be applied via SDK configuration.
 * These mirror the chainable setters on Request (headers, cache, retry, etc.).
 */
export type SdkRequestDefaults = {
  headers?: HeadersInit;
  auth?: boolean;
  cache?: boolean;
  cacheTime?: number;
  staleTime?: number;
  retry?: number;
  retryTime?: number;
  cancelable?: boolean;
  queued?: boolean;
  offline?: boolean;
  deduplicate?: boolean;
  deduplicateTime?: number | null;
};

/**
 * Recursively extracts all endpoint strings from an SDK schema type.
 * Leaf nodes (keys starting with $) are RequestInstance — extract endpoint from those.
 * Other keys are nested schema segments to recurse into.
 */
type ExtractSdkEndpoints<T, Depth extends unknown[] = []> = Depth["length"] extends 10
  ? never
  : {
      [K in keyof T]: K extends `$${string}`
        ? T[K] extends RequestInstance
          ? ExtractEndpointType<T[K]>
          : never
        : T[K] extends Record<string, any>
          ? ExtractSdkEndpoints<T[K], [...Depth, unknown]>
          : never;
    }[keyof T];

/**
 * Builds the set of valid configuration keys from an SDK schema:
 * - "*" (global wildcard)
 * - exact endpoint paths extracted from RequestInstance nodes
 * - wildcard patterns like "/users/*"
 */
type SdkConfigurationKeys<Schema extends RecursiveSchemaType> =
  | "*"
  | ExtractSdkEndpoints<Schema>
  | `${ExtractSdkEndpoints<Schema> & string}/*`;

/**
 * Maps endpoint paths or wildcard patterns to request defaults.
 * Keys are validated against the SDK schema — only known endpoints, their wildcard
 * variants, and "*" are accepted.
 */
export type SdkConfigurationMap<Schema extends RecursiveSchemaType = RecursiveSchemaType> = Partial<
  Record<SdkConfigurationKeys<Schema>, SdkRequestDefaults>
>;

export type CreateSdkOptions<Schema extends RecursiveSchemaType = RecursiveSchemaType> = {
  /** @default true */
  camelCaseToKebabCase?: boolean;
  /** @default (method) => method.toUpperCase() */
  methodTransform?: (method: string) => string;
  /** Per-endpoint request defaults */
  defaults?: SdkConfigurationMap<Schema>;
};

const getMethod = (key: string, options?: CreateSdkOptions<any>) => {
  const { methodTransform = (method: string) => method.toUpperCase() } = options ?? {};
  return methodTransform(key);
};

const endpointMatchesPattern = (endpoint: string, pattern: string): boolean => {
  if (pattern === "*") return true;
  if (pattern === endpoint) return true;
  // Simple wildcard: "/users/*" matches "/users/:userId", "/users/:userId/posts", etc.
  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -1);
    return endpoint.startsWith(prefix) || endpoint === prefix.slice(0, -1);
  }
  return false;
};

const applyDefaults = (
  request: RequestInstance,
  endpoint: string,
  defaults?: Record<string, SdkRequestDefaults>,
): RequestInstance => {
  if (!defaults) return request;

  let result = request;
  const entries = Object.entries(defaults);

  for (let i = 0; i < entries.length; i += 1) {
    const [pattern, config] = entries[i];
    if (endpointMatchesPattern(endpoint, pattern)) {
      if (config.headers) result = result.setHeaders(config.headers);
      if (config.auth !== undefined) result = result.setAuth(config.auth);
      if (config.cache !== undefined) result = result.setCache(config.cache);
      if (config.cacheTime !== undefined) result = result.setCacheTime(config.cacheTime);
      if (config.staleTime !== undefined) result = result.setStaleTime(config.staleTime);
      if (config.retry !== undefined) result = result.setRetry(config.retry);
      if (config.retryTime !== undefined) result = result.setRetryTime(config.retryTime);
      if (config.cancelable !== undefined) result = result.setCancelable(config.cancelable);
      if (config.queued !== undefined) result = result.setQueued(config.queued);
      if (config.offline !== undefined) result = result.setOffline(config.offline);
      if (config.deduplicate !== undefined) result = result.setDeduplicate(config.deduplicate);
      if (config.deduplicateTime !== undefined && config.deduplicateTime !== null) {
        result = result.setDeduplicateTime(config.deduplicateTime);
      }
    }
  }

  return result;
};

const createRecursiveProxy = (client: ClientInstance, path: string[], options?: CreateSdkOptions<any>): any => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return new Proxy(() => {}, {
    get: (_target, key: string) => {
      if (typeof key === "symbol" || key === "inspect") {
        return undefined;
      }

      // Check if this is a method (starts with $) or a path segment
      let isMethod = false;
      let methodName = key;
      let pathSegment = key;

      if (key.startsWith("$")) {
        // This could be either a method or a parameter
        // Try to determine by checking if it's a terminal access (method)
        // For now, assume it's a method and strip the $ prefix
        isMethod = true;
        methodName = key.slice(1);
        pathSegment = `:${key.slice(1)}`; // Convert to parameter format for path building
      } else if (options?.camelCaseToKebabCase) {
        // Convert camelCase to kebab-case for path segments if option is enabled
        pathSegment = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      }

      // Always create a request assuming this is a method call
      const endpoint = `/${path.join("/")}`;
      const method = getMethod(isMethod ? methodName : key, options);
      let request: RequestInstance = client.createRequest()({ endpoint, method });
      request = applyDefaults(request, endpoint, options?.defaults);

      // But also, assume the key is a new path segment for a deeper call
      const newPath = [...path, pathSegment];
      const deeperProxy = createRecursiveProxy(client, newPath, options);

      // Return a new proxy that wraps both the request and the deeper proxy
      return new Proxy(request, {
        get: (reqTarget, reqKey: string) => {
          // If the property exists on the request instance (like .send(), .setParams()), return it.
          if (reqKey in reqTarget) {
            return reqTarget[reqKey as keyof typeof reqTarget];
          }
          // Otherwise, it's a deeper path, so delegate to the deeper proxy.
          return deeperProxy[reqKey];
        },
      });
    },
  });
};

export type SdkInstance<Schema extends RecursiveSchemaType> = Schema & {
  /**
   * Apply request defaults to the SDK. Returns a new SDK instance with the configuration applied.
   * Use "*" to match all endpoints, or specific endpoint strings / wildcard patterns.
   */
  $configure: (defaults: SdkConfigurationMap<Schema>) => SdkInstance<Schema>;
};

export const createSdk = <Client extends ClientInstance, RecursiveSchema extends RecursiveSchemaType>(
  client: Client,
  options?: CreateSdkOptions<RecursiveSchema>,
): SdkInstance<RecursiveSchema> => {
  const {
    camelCaseToKebabCase = true,
    methodTransform = (method: string) => method.toUpperCase(),
    ...rest
  } = options ?? {};

  const mergedOptions: CreateSdkOptions<RecursiveSchema> = { camelCaseToKebabCase, methodTransform, ...rest };
  // Break inference for TypeDoc / tsserver (TS2589) — runtime value is unchanged.
  const proxy = createRecursiveProxy(client, [], mergedOptions as never);

  return new Proxy(proxy, {
    get: (target, key: string) => {
      if (key === "$configure") {
        return (defaults: SdkConfigurationMap<RecursiveSchema>) => {
          const existingDefaults = mergedOptions.defaults || {};
          return createSdk<Client, RecursiveSchema>(client, {
            ...mergedOptions,
            defaults: { ...existingDefaults, ...defaults } as SdkConfigurationMap<RecursiveSchema>,
          });
        };
      }
      return target[key];
    },
  }) as SdkInstance<RecursiveSchema>;
};

/**
 * Type-safe factory for creating SDK configuration maps.
 *
 * @example
 * const config = createConfiguration<MySdkSchema>()({ "*": { retry: 3 } })
 */
export const createConfiguration = <Schema extends RecursiveSchemaType>() => {
  return (defaults: SdkConfigurationMap<Schema>): SdkConfigurationMap<Schema> => defaults;
};
