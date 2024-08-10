import { useMemo } from "react";

import { useDevtoolsContext } from "devtools.context";
import { Content } from "./content/content";
import { Toolbar } from "./toolbar/toolbar";
import { Details } from "./details/details";

// TODO: Info about hydration - "is hydrated"?
// How much time left to garbage collect?
// How much time left for cache?
export const Cache = () => {
  const { cache, detailsCacheKey } = useDevtoolsContext("DevtoolsNetworkContent");

  const activatedCache = useMemo(() => {
    if (!detailsCacheKey) return null;
    return cache.find((request) => request.cacheKey === detailsCacheKey);
  }, [detailsCacheKey, cache]);

  return (
    <>
      <Toolbar />
      <Content />
      {activatedCache && <Details item={activatedCache} />}
    </>
  );
};
