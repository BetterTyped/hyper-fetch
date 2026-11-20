import type { LoadContext, Plugin } from "@docusaurus/types";

import type { GithubRelease, HyperFlowRelease } from "../components/hyper-flow-downloads/releases";
import { getLatestHyperFlowRelease, HYPER_FLOW_RELEASES_API } from "../components/hyper-flow-downloads/releases";

export const HYPER_FLOW_RELEASES_PLUGIN = "hyperflow-releases";

export type HyperFlowReleasesData = {
  release: HyperFlowRelease | null;
  /** When the build looked the release up */
  checkedAt: string;
};

/**
 * Looks the newest HyperFlow installers up once per docs build, so the download page renders them without asking
 * GitHub on every visit. CI passes `GITHUB_TOKEN`, which lifts the API limit for the build.
 */
export default function hyperFlowReleasesPlugin(_context: LoadContext): Plugin<unknown> {
  return {
    name: HYPER_FLOW_RELEASES_PLUGIN,
    async loadContent(): Promise<HyperFlowReleasesData> {
      const checkedAt = new Date().toISOString();
      try {
        const token = process.env.GITHUB_TOKEN;
        const response = await fetch(HYPER_FLOW_RELEASES_API, {
          headers: {
            Accept: "application/vnd.github+json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) {
          console.warn(`[${HYPER_FLOW_RELEASES_PLUGIN}] GitHub answered ${response.status}, the page loads it later`);
          return { release: null, checkedAt };
        }
        const releases = (await response.json()) as GithubRelease[];
        return { release: getLatestHyperFlowRelease(releases), checkedAt };
      } catch (error) {
        // Offline builds still work, the page then asks GitHub in the browser
        console.warn(`[${HYPER_FLOW_RELEASES_PLUGIN}] Could not load releases: ${String(error)}`);
        return { release: null, checkedAt };
      }
    },
    async contentLoaded({ content, actions }) {
      actions.setGlobalData(content);
    },
  };
}
