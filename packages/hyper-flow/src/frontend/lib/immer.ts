import { enableMapSet, setAutoFreeze } from "immer";

/**
 * Stores keep Maps and Sets in Immer drafts and hand out mutable references, so the renderer and the specs must share
 * one Immer setup. Call it once before any store is used.
 */
export const configureImmer = () => {
  setAutoFreeze(false);
  enableMapSet();
};
