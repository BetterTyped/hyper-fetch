import { usePluginData } from "@docusaurus/useGlobalData";
import { useEffect, useMemo, useState } from "react";

import type { SponsorsPluginData } from "../../plugins/sponsors";
import { SPONSORS_PLUGIN } from "../../plugins/sponsors";
import type { SponsorsFeed } from "./feed";
import { isSponsorsFeed, selectSponsors, SPONSORS_FEED_URL } from "./feed";

/* One request per visit, shared by every component that shows sponsors. */
let latest: Promise<SponsorsFeed | null> | null = null;

const loadLatest = () => {
  // The CDN tells browsers to keep the file for a week; revalidating costs a 304 and shows a new partner at once.
  latest ??= fetch(SPONSORS_FEED_URL, { cache: "no-cache" })
    .then((response) => (response.ok ? response.json() : null))
    .then((body: unknown) => (isSponsorsFeed(body) ? body : null))
    .catch(() => null);
  return latest;
};

/**
 * The partners and sponsors this site shows. Renders the feed from the build first, then swaps in the CDN's copy
 * when it is newer, so a partner added after the last deploy still shows up.
 */
export const useSponsors = () => {
  const { feed: built } = usePluginData(SPONSORS_PLUGIN) as SponsorsPluginData;
  const [feed, setFeed] = useState(built);

  useEffect(() => {
    let alive = true;
    loadLatest().then((fresh) => {
      if (alive && fresh && fresh.generatedAt > built.generatedAt)
        setFeed(fresh);
    });
    return () => {
      alive = false;
    };
  }, [built]);

  return useMemo(() => ({ feed, ...selectSponsors(feed) }), [feed]);
};
