import type { LoadContext, Plugin } from "@docusaurus/types";

import type { SponsorsFeed } from "../components/sponsors/feed";
import { isSponsorsFeed, SPONSORS_FEED_URL } from "../components/sponsors/feed";
import snapshot from "../components/sponsors/sponsors.snapshot.json";

export const SPONSORS_PLUGIN = "sponsors-feed";

export type SponsorsPluginData = { feed: SponsorsFeed };

/**
 * Reads the sponsors feed once per docs build, so every page renders its partners and sponsors in the HTML. A build
 * that cannot reach the feed uses the snapshot in the repo, and the page refreshes it in the browser.
 */
export default function sponsorsPlugin(_context: LoadContext): Plugin<unknown> {
  return {
    name: SPONSORS_PLUGIN,
    async loadContent(): Promise<SponsorsPluginData> {
      try {
        const response = await fetch(SPONSORS_FEED_URL, {
          signal: AbortSignal.timeout(10_000),
        });
        const body: unknown = response.ok ? await response.json() : null;
        if (isSponsorsFeed(body)) return { feed: body };
        console.warn(
          `[${SPONSORS_PLUGIN}] The feed answered ${response.status}, using the snapshot`,
        );
      } catch (error) {
        console.warn(
          `[${SPONSORS_PLUGIN}] Could not load the feed, using the snapshot: ${String(error)}`,
        );
      }
      if (!isSponsorsFeed(snapshot))
        throw new Error(
          `[${SPONSORS_PLUGIN}] sponsors.snapshot.json is not a v1 feed`,
        );
      return { feed: snapshot };
    },
    async contentLoaded({ content, actions }) {
      actions.setGlobalData(content);
    },
  };
}
