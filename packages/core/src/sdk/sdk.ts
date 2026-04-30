import type { ClientInstance } from "client";
import type { Request, RequestInstance } from "request";
import type {
  ExtractEndpointType,
  ExtractResponseType,
  ExtractPayloadType,
  ExtractQueryParamsType,
  ExtractLocalErrorType,
  ExtractHasPayloadType,
  ExtractHasParamsType,
  ExtractHasQueryParamsType,
  ExtractMutationContextType,
} from "types";

export type RecursiveSchemaType = Record<
  string, // for example users / $userId / posts / $postId
  any
>;

/**
 * Recursively walks a schema and rebuilds every `Request` leaf with the SDK's actual client
 * type injected into the `Client` generic slot. Lets users omit `client` from their
 * `RequestModel<{...}>` declarations - the SDK fills it in from the client passed to
 * `createSdk(client)`.
 *
 * Non-Request leaves (primitive values, plain types) are passed through unchanged. Nested
 * schema objects are recursed into. Depth is guarded at 10 levels to keep the type checker
 * within reasonable bounds.
 */
export type InjectClient<T, TClient extends ClientInstance, Depth extends unknown[] = []> = Depth["length"] extends 10
  ? T
  : T extends RequestInstance
    ? Request<
        ExtractResponseType<T>,
        ExtractPayloadType<T>,
        ExtractQueryParamsType<T>,
        ExtractLocalErrorType<T>,
        ExtractEndpointType<T> extends string ? ExtractEndpointType<T> : string,
        TClient,
        ExtractHasPayloadType<T> extends boolean ? ExtractHasPayloadType<T> : false,
        ExtractHasParamsType<T> extends boolean ? ExtractHasParamsType<T> : false,
        ExtractHasQueryParamsType<T> extends boolean ? ExtractHasQueryParamsType<T> : false,
        ExtractMutationContextType<T>
      >
    : T extends Record<string, any>
      ? { [K in keyof T]: InjectClient<T[K], TClient, [...Depth, unknown]> }
      : T;

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
 * Configuration value: either a static property bag or a function that receives
 * the request and returns a modified request (full access to every Request setter).
 */
export type SdkConfigurationValue = SdkRequestDefaults | ((request: RequestInstance) => RequestInstance);

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
 * Recursively extracts dot-path accessor keys from an SDK schema.
 * These mirror the SDK property chain: "users.$get", "users.$userId.$get", etc.
 */
type ExtractSdkPaths<T, Prefix extends string = "", Depth extends unknown[] = []> = Depth["length"] extends 10
  ? never
  : {
      [K in keyof T & string]: T[K] extends RequestInstance
        ? `${Prefix}${K}`
        : T[K] extends Record<string, any>
          ? ExtractSdkPaths<T[K], `${Prefix}${K}.`, [...Depth, unknown]>
          : never;
    }[keyof T & string];

/**
 * Builds the set of valid configuration keys from an SDK schema:
 * - "*" (global wildcard)
 * - exact endpoint paths extracted from RequestInstance nodes (group keys)
 * - wildcard patterns like "/users/*" (group keys)
 * - dot-path accessor keys like "users.$get" (method-specific keys)
 */
type SdkConfigurationKeys<Schema extends RecursiveSchemaType> =
  | "*"
  | ExtractSdkEndpoints<Schema>
  | `${ExtractSdkEndpoints<Schema> & string}/*`
  | ExtractSdkPaths<Schema>;

/**
 * Maps endpoint paths, wildcard patterns, or dot-path accessor keys to request defaults.
 * Keys are validated against the SDK schema.
 *
 * Values can be:
 * - A plain `SdkRequestDefaults` object (shorthand for common settings)
 * - A function `(request) => request` for full access to every Request setter
 */
export type SdkConfigurationMap<Schema extends RecursiveSchemaType = RecursiveSchemaType> = Partial<
  Record<SdkConfigurationKeys<Schema>, SdkConfigurationValue>
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
  if (pattern === "*") {return true;}
  if (pattern === endpoint) {return true;}
  // Simple wildcard: "/users/*" matches "/users/:userId", "/users/:userId/posts", etc.
  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -1);
    return endpoint.startsWith(prefix) || endpoint === prefix.slice(0, -1);
  }
  return false;
};

const isDotPath = (key: string): boolean => {
  return key.includes(".") && !key.startsWith("/");
};

const applyObjectDefaults = (request: RequestInstance, config: SdkRequestDefaults): RequestInstance => {
  let result = request;
  if (config.headers) {result = result.setHeaders(config.headers);}
  if (config.auth !== undefined) {result = result.setAuth(config.auth);}
  if (config.cache !== undefined) {result = result.setCache(config.cache);}
  if (config.cacheTime !== undefined) {result = result.setCacheTime(config.cacheTime);}
  if (config.staleTime !== undefined) {result = result.setStaleTime(config.staleTime);}
  if (config.retry !== undefined) {result = result.setRetry(config.retry);}
  if (config.retryTime !== undefined) {result = result.setRetryTime(config.retryTime);}
  if (config.cancelable !== undefined) {result = result.setCancelable(config.cancelable);}
  if (config.queued !== undefined) {result = result.setQueued(config.queued);}
  if (config.offline !== undefined) {result = result.setOffline(config.offline);}
  if (config.deduplicate !== undefined) {result = result.setDeduplicate(config.deduplicate);}
  if (config.deduplicateTime !== undefined && config.deduplicateTime !== null) {
    result = result.setDeduplicateTime(config.deduplicateTime);
  }
  return result;
};

const applyDefaults = (
  request: RequestInstance,
  context: { endpoint: string; sdkPath: string; defaults?: Partial<Record<string, SdkConfigurationValue>> },
): RequestInstance => {
  const { endpoint, sdkPath, defaults } = context;
  if (!defaults) {return request;}

  let result = request;
  const entries = Object.entries(defaults);

  // Sort: "*" first, then endpoint groups (start with "/"), then dot-path (method-specific) last
  const globalEntries: [string, SdkConfigurationValue][] = [];
  const groupEntries: [string, SdkConfigurationValue][] = [];
  const pathEntries: [string, SdkConfigurationValue][] = [];

  for (let i = 0; i < entries.length; i += 1) {
    const [key, value] = entries[i];
    if (!value) {continue;}
    const entry: [string, SdkConfigurationValue] = [key, value];
    if (entry[0] === "*") {
      globalEntries.push(entry);
    } else if (isDotPath(entry[0])) {
      pathEntries.push(entry);
    } else {
      groupEntries.push(entry);
    }
  }

  const sorted = [...globalEntries, ...groupEntries, ...pathEntries];

  for (let i = 0; i < sorted.length; i += 1) {
    const [pattern, config] = sorted[i];

    let matches = false;
    if (isDotPath(pattern)) {
      matches = pattern === sdkPath;
    } else {
      matches = endpointMatchesPattern(endpoint, pattern);
    }

    if (matches) {
      if (typeof config === "function") {
        result = config(result);
      } else {
        result = applyObjectDefaults(result, config);
      }
    }
  }

  return result;
};

const createRecursiveProxy = (
  client: ClientInstance,
  context: { path: string[]; sdkKeys: string[]; options?: CreateSdkOptions<any> },
): any => {
  const { path, sdkKeys, options } = context;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return new Proxy(() => {}, {
    get: (_target, key: string) => {
      if (typeof key === "symbol" || key === "inspect") {
        return;
      }

      // Check if this is a method (starts with $) or a path segment
      let isMethod = false;
      let methodName = key;
      let pathSegment = key;

      if (key.startsWith("$")) {
        isMethod = true;
        methodName = key.slice(1);
        pathSegment = `:${key.slice(1)}`;
      } else if (options?.camelCaseToKebabCase) {
        pathSegment = key.replaceAll(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      }

      // Build the sdk dot-path for method-specific configuration matching
      const currentSdkKeys = [...sdkKeys, key];
      const sdkPath = currentSdkKeys.join(".");

      // Always create a request assuming this is a method call
      const endpoint = `/${path.join("/")}`;
      const method = getMethod(isMethod ? methodName : key, options);
      let request: RequestInstance = client.createRequest()({ endpoint, method });
      request = applyDefaults(request, { endpoint, sdkPath, defaults: options?.defaults });

      // But also, assume the key is a new path segment for a deeper call
      const newPath = [...path, pathSegment];
      const deeperProxy = createRecursiveProxy(client, { path: newPath, sdkKeys: currentSdkKeys, options });

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

/**
 * The fully-resolved SDK instance type returned by `createSdk`.
 *
 * The schema is rewritten via {@link InjectClient} so every `Request` leaf carries the
 * actual client type passed to `createSdk(client)` - users do not need to repeat
 * `client: AppClient` in every `RequestModel<{...}>` declaration.
 */
export type SdkInstance<
  Schema extends RecursiveSchemaType,
  TClient extends ClientInstance = ClientInstance,
> = InjectClient<Schema, TClient> & {
  /**
   * Apply request defaults to the SDK. Returns a new SDK instance with the configuration applied.
   * Use "*" to match all endpoints, or specific endpoint strings / wildcard patterns.
   */
  $configure: (defaults: SdkConfigurationMap<Schema>) => SdkInstance<Schema, TClient>;
};

export const createSdk = <Client extends ClientInstance, RecursiveSchema extends RecursiveSchemaType>(
  client: Client,
  options?: CreateSdkOptions<RecursiveSchema>,
): SdkInstance<RecursiveSchema, Client> => {
  const {
    camelCaseToKebabCase = true,
    methodTransform = (method: string) => method.toUpperCase(),
    ...rest
  } = options ?? {};

  const mergedOptions: CreateSdkOptions<RecursiveSchema> = { camelCaseToKebabCase, methodTransform, ...rest };
  // Break inference for TypeDoc / tsserver (TS2589) — runtime value is unchanged.
  const proxy = createRecursiveProxy(client, { path: [], sdkKeys: [], options: mergedOptions as never });

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
  }) as SdkInstance<RecursiveSchema, Client>;
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
