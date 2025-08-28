import { ClientInstance } from "client";

export type RecursiveSchemaType = Record<
  string, // for example users / $userId / posts / $postId
  any
>;

export type CreateSdkOptions = {
  /** @default true */
  camelCaseToKebabCase?: boolean;
  /** @default (method) => method.toUpperCase() */
  methodTransform?: (method: string) => string;
};

const getMethod = (key: string, options?: CreateSdkOptions) => {
  const { methodTransform = (method: string) => method.toUpperCase() } = options ?? {};
  return methodTransform(key);
};

const createRecursiveProxy = (client: ClientInstance, path: string[], options?: CreateSdkOptions): any => {
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
      const request = client.createRequest()({ endpoint, method });

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

export const createSdk = <Client extends ClientInstance, RecursiveSchema extends RecursiveSchemaType>(
  client: Client,
  options?: CreateSdkOptions,
): RecursiveSchema => {
  const {
    camelCaseToKebabCase = true,
    methodTransform = (method: string) => method.toUpperCase(),
    ...rest
  } = options ?? {};
  return createRecursiveProxy(client, [], { camelCaseToKebabCase, methodTransform, ...rest }) as RecursiveSchema;
};
