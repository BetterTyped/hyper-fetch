import { ClientInstance } from "client";

export type RecursiveSchemaType = Record<
  string, // for example users / $userId / posts / $postId
  any
>;

const createRecursiveProxy = (client: ClientInstance, path: string[]): any => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return new Proxy(() => {}, {
    get: (_target, key: string) => {
      if (typeof key === "symbol" || key === "inspect") {
        return undefined;
      }

      // Assume the key is a method for the current path
      const endpoint = `/${path.join("/")}`;
      const method = key.toUpperCase();
      const request = client.createRequest()({ endpoint, method });

      // But also, assume the key is a new path segment for a deeper call
      const newPath = [...path, key.startsWith("$") ? `:${key.slice(1)}` : key];
      const deeperProxy = createRecursiveProxy(client, newPath);

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
): RecursiveSchema => {
  return createRecursiveProxy(client, []) as RecursiveSchema;
};
