import React, { useContext, useEffect, useLayoutEffect, useMemo, useRef } from "react";

import type { HydrateProps, HydrationContextType } from "./hydrate.types";
import { getHydratedEntries, isConsumed, markConsumed, shouldUseHydratedValue } from "./hydrate.utils";

const HydrationContext = React.createContext<HydrationContextType | null>(null);

// Layout effects do not run on the server; on the client they run before any passive effect of the tree
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Hydrates the client cache with data fetched on the server.
 *
 * - Hooks below it render with the hydrated data on the first render, also during server rendering.
 * - On the client the data is written to the cache before the hooks mount, so fresh data is not refetched.
 * - Newer cache data is never replaced by an older snapshot.
 * - It can be nested and rendered conditionally; every `Hydrate` serves only its own client.
 */
export const Hydrate = ({ client, data, options, children }: HydrateProps) => {
  const parent = useContext(HydrationContext);

  const entries = useMemo(() => getHydratedEntries(client, data, options), [client, data, options]);

  // Read through a ref, so the context value stays stable when only the entries change (e.g. inline options)
  // and memoized children do not re-render. Hooks read the context only on their first render.
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  useIsomorphicLayoutEffect(() => {
    // Server mode cache does not store unscoped data - the context keeps serving it instead
    if (client.mode === "server") {
      return;
    }

    entries.forEach((entry) => {
      if (isConsumed(client, entry.item)) {
        return;
      }
      markConsumed(client, entry.item);

      const cacheData = client.cache.get(entry.storageKey);
      if (!shouldUseHydratedValue(cacheData, entry)) {
        return;
      }

      client.hydrate([entry.item], options);
    });
  }, [client, entries, options]);

  const value = useMemo<HydrationContextType>(
    () => ({
      get: (targetClient, storageKey) => {
        if (targetClient === client) {
          const entry = entriesRef.current.get(storageKey);
          if (entry) {
            return isConsumed(client, entry.item) ? undefined : entry;
          }
        }
        return parent?.get(targetClient, storageKey);
      },
    }),
    [client, parent],
  );

  return <HydrationContext.Provider value={value}>{children}</HydrationContext.Provider>;
};

/**
 * Access to the closest hydration data
 * @internal
 */
export const useHydration = (): HydrationContextType | null => {
  return useContext(HydrationContext);
};
