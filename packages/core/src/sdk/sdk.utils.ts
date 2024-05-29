// Recursive proxy from TRPC https://github.com/trpc/trpc/blob/94f198fece23e9328f7a30d1badf74de524b0ebb/packages/server/src/unstable-core-do-not-import/createProxy.ts#L49

interface ProxyCallbackOptions {
  path: string[];
  args: unknown[];
}
type ProxyCallback = (opts: ProxyCallbackOptions) => unknown;

const noop = () => {
  // noop
};

function createInnerProxy(callback: ProxyCallback, path: string[]) {
  const proxy: unknown = new Proxy(noop, {
    get(_obj, key) {
      if (typeof key !== "string" || key === "then") {
        // special case for if the proxy is accidentally treated
        // like a PromiseLike (like in `Promise.resolve(proxy)`)
        return undefined;
      }
      return createInnerProxy(callback, [...path, key]);
    },
    // apply(_1, _2, args) {
    //   const lastOfPath = path[path.length - 1];

    //   let opts = { args, path };
    //   // special handling for e.g. `trpc.hello.call(this, 'there')` and `trpc.hello.apply(this, ['there'])
    //   if (lastOfPath === "call") {
    //     opts = {
    //       args: args.length >= 2 ? [args[1]] : [],
    //       path: path.slice(0, -1),
    //     };
    //   } else if (lastOfPath === "apply") {
    //     opts = {
    //       args: args.length >= 2 ? args[1] : [],
    //       path: path.slice(0, -1),
    //     };
    //   }
    //   return callback(opts);
    // },
  });

  return proxy;
}

export const createRecursiveProxy = (callback: ProxyCallback) => createInnerProxy(callback, []);

export const createFlatProxy = <TFaux>(callback: (path: string & keyof TFaux) => any): TFaux => {
  return new Proxy(noop, {
    get(_obj, name) {
      if (typeof name !== "string" || name === "then") {
        // special case for if the proxy is accidentally treated
        // like a PromiseLike (like in `Promise.resolve(proxy)`)
        return undefined;
      }
      return callback(name as any);
    },
  }) as TFaux;
};
