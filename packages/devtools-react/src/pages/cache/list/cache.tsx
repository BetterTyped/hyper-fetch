import { Content } from "./content/content";
import { Toolbar } from "./toolbar/toolbar";

// TODO: Info about hydration - "is hydrated"?
// How much time left to garbage collect?
// How much time left for cache?
export const CacheList = () => {
  return (
    <>
      <Toolbar />
      <Content />
    </>
  );
};
