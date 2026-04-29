import type { SocketInstance } from "socket";
import type { ListenerInstance } from "listener";
import type { EmitterInstance } from "emitter";

export type RecursiveSocketSchemaType = Record<string, any>;

type SocketSdkLeaf = ListenerInstance | EmitterInstance;

type ExtractTopicFromLeaf<T> = T extends { topic: infer Topic extends string } ? Topic : never;

/**
 * Recursively extracts topic strings from leaf nodes in a socket SDK schema.
 */
type ExtractSocketTopics<T, Depth extends unknown[] = []> = Depth["length"] extends 10
  ? never
  : {
      [K in keyof T & string]: T[K] extends SocketSdkLeaf
        ? ExtractTopicFromLeaf<T[K]>
        : T[K] extends Record<string, any>
          ? ExtractSocketTopics<T[K], [...Depth, unknown]>
          : never;
    }[keyof T & string];

/**
 * Extracts all intermediate prefixes from a slash-separated topic.
 * "chat/messages/pinned" → "chat" | "chat/messages"
 */
type TopicPrefixes<T extends string> = T extends `${infer Head}/${infer Tail}`
  ? Head | `${Head}/${TopicPrefixes<Tail> & string}`
  : never;

/**
 * Recursively extracts dot-path accessor keys from a socket SDK schema.
 * These mirror the SDK property chain: "chat.$listener", "chat.messages.$emitter", etc.
 */
type ExtractSocketSdkPaths<T, Prefix extends string = "", Depth extends unknown[] = []> = Depth["length"] extends 10
  ? never
  : {
      [K in keyof T & string]: T[K] extends SocketSdkLeaf
        ? `${Prefix}${K}`
        : T[K] extends Record<string, any>
          ? ExtractSocketSdkPaths<T[K], `${Prefix}${K}.`, [...Depth, unknown]>
          : never;
    }[keyof T & string];

type AllTopicKeys<Schema extends RecursiveSocketSchemaType> = ExtractSocketTopics<Schema>;

/**
 * Builds the set of valid configuration keys from a socket SDK schema:
 * - "*" (global wildcard)
 * - exact topic strings extracted from leaf nodes (topic group keys)
 * - wildcard topic patterns like "chat/*" (topic group keys)
 * - dot-path accessor keys like "chat.messages.$listener" (instance-specific keys)
 */
type SocketSdkConfigurationKeys<Schema extends RecursiveSocketSchemaType> =
  | "*"
  | AllTopicKeys<Schema>
  | `${(AllTopicKeys<Schema> | TopicPrefixes<AllTopicKeys<Schema> & string>) & string}/*`
  | ExtractSocketSdkPaths<Schema>;

export type SocketSdkDefaults = {
  options?: Record<string, unknown>;
};

export type SocketSdkConfigurationValue = SocketSdkDefaults | ((instance: SocketSdkLeaf) => SocketSdkLeaf);

/**
 * Resolves a dot-path key to its leaf type in the schema.
 * "chat.messages.$listener" → ListenerInstance<...>
 */
type ResolveDotPath<T, Path extends string> = Path extends `${infer Head}.${infer Tail}`
  ? Head extends keyof T
    ? ResolveDotPath<T[Head], Tail>
    : SocketSdkLeaf
  : Path extends keyof T
    ? T[Path]
    : SocketSdkLeaf;

type SocketSdkConfigurationValueFor<T> = SocketSdkDefaults | ((instance: T) => T);

export type SocketSdkConfigurationMap<Schema extends RecursiveSocketSchemaType = RecursiveSocketSchemaType> = {
  [K in SocketSdkConfigurationKeys<Schema>]?: SocketSdkConfigurationValueFor<
    K extends ExtractSocketSdkPaths<Schema> ? ResolveDotPath<Schema, K> : SocketSdkLeaf
  >;
};

export type CreateSocketSdkOptions<Schema extends RecursiveSocketSchemaType = RecursiveSocketSchemaType> = {
  /** @default true */
  camelCaseToKebabCase?: boolean;
  /** Per-path defaults (plain objects or functions) */
  defaults?: SocketSdkConfigurationMap<Schema>;
};

const LEAF_KEYS = new Set(["$listener", "$emitter"]);

const isDotPath = (key: string): boolean => {
  return key.includes(".") && !key.includes("/");
};

const isTopicGroup = (key: string): boolean => {
  return key.includes("/") || (!key.includes(".") && key !== "*");
};

const topicMatchesPattern = (topic: string, pattern: string): boolean => {
  if (pattern === "*") return true;
  if (pattern === topic) return true;
  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -1);
    return topic.startsWith(prefix) || topic === prefix.slice(0, -1);
  }
  return false;
};

const applySocketObjectDefaults = (instance: SocketSdkLeaf, config: SocketSdkDefaults): SocketSdkLeaf => {
  let result = instance;
  if (config.options !== undefined) result = result.setOptions(config.options);
  return result;
};

const applySocketDefaults = ({
  instance,
  topic,
  sdkPath,
  defaults,
}: {
  instance: SocketSdkLeaf;
  topic: string;
  sdkPath: string;
  defaults?: Partial<Record<string, SocketSdkConfigurationValue>>;
}): SocketSdkLeaf => {
  if (!defaults) return instance;

  let result = instance;
  const entries = Object.entries(defaults);

  const globalEntries: [string, SocketSdkConfigurationValue][] = [];
  const groupEntries: [string, SocketSdkConfigurationValue][] = [];
  const pathEntries: [string, SocketSdkConfigurationValue][] = [];

  for (let i = 0; i < entries.length; i += 1) {
    const [key, value] = entries[i];
    if (!value) continue;
    const entry: [string, SocketSdkConfigurationValue] = [key, value];
    if (entry[0] === "*") {
      globalEntries.push(entry);
    } else if (isDotPath(entry[0])) {
      pathEntries.push(entry);
    } else if (isTopicGroup(entry[0])) {
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
      matches = topicMatchesPattern(topic, pattern);
    }

    if (matches) {
      if (typeof config === "function") {
        result = config(result) as SocketSdkLeaf;
      } else {
        result = applySocketObjectDefaults(result, config);
      }
    }
  }

  return result;
};

const createSocketRecursiveProxy = ({
  socket,
  path,
  sdkKeys,
  options,
}: {
  socket: SocketInstance;
  path: string[];
  sdkKeys: string[];
  options?: CreateSocketSdkOptions<any>;
}): any => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return new Proxy(() => {}, {
    get: (_target, key: string) => {
      if (typeof key === "symbol" || key === "inspect") {
        return undefined;
      }

      const currentSdkKeys = [...sdkKeys, key];
      const sdkPath = currentSdkKeys.join(".");

      let pathSegment = key;

      if (key.startsWith("$") && !LEAF_KEYS.has(key)) {
        pathSegment = `:${key.slice(1)}`;
      } else if (options?.camelCaseToKebabCase) {
        pathSegment = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      }

      if (LEAF_KEYS.has(key)) {
        const topic = path.join("/");

        let instance: SocketSdkLeaf;
        if (key === "$listener") {
          instance = socket.createListener()({ topic });
        } else {
          instance = socket.createEmitter()({ topic });
        }

        instance = applySocketDefaults({ instance, topic, sdkPath, defaults: options?.defaults });
        return instance;
      }

      const newPath = [...path, pathSegment];
      const deeperProxy = createSocketRecursiveProxy({ socket, path: newPath, sdkKeys: currentSdkKeys, options });

      return deeperProxy;
    },
  });
};

export type SocketSdkInstance<Schema extends RecursiveSocketSchemaType> = Schema & {
  $configure: (defaults: SocketSdkConfigurationMap<Schema>) => SocketSdkInstance<Schema>;
};

export const createSocketSdk = <S extends SocketInstance, RecursiveSchema extends RecursiveSocketSchemaType>(
  socket: S,
  options?: CreateSocketSdkOptions<RecursiveSchema>,
): SocketSdkInstance<RecursiveSchema> => {
  const { camelCaseToKebabCase = true, ...rest } = options ?? {};

  const mergedOptions: CreateSocketSdkOptions<RecursiveSchema> = { camelCaseToKebabCase, ...rest };
  const proxy = createSocketRecursiveProxy({ socket, path: [], sdkKeys: [], options: mergedOptions as never });

  return new Proxy(proxy, {
    get: (target: any, key: string) => {
      if (key === "$configure") {
        return (defaults: SocketSdkConfigurationMap<RecursiveSchema>) => {
          const existingDefaults = mergedOptions.defaults || {};
          return createSocketSdk<S, RecursiveSchema>(socket, {
            ...mergedOptions,
            defaults: { ...existingDefaults, ...defaults } as SocketSdkConfigurationMap<RecursiveSchema>,
          });
        };
      }
      return target[key];
    },
  }) as SocketSdkInstance<RecursiveSchema>;
};

/**
 * Type-safe factory for creating socket SDK configuration maps.
 *
 * @example
 * const config = createSocketConfiguration<MyChatSchema>()({
 *   "*": { options: { reconnect: true } },
 *   "chat.messages.$listener": (instance) => instance.setOptions({ buffer: true }),
 * })
 */
export const createSocketConfiguration = <Schema extends RecursiveSocketSchemaType>() => {
  return (defaults: SocketSdkConfigurationMap<Schema>): SocketSdkConfigurationMap<Schema> => defaults;
};
