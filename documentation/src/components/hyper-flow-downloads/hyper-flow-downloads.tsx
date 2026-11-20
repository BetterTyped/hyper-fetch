import { usePluginData } from "@docusaurus/useGlobalData";
import { createClient } from "@hyper-fetch/core";
import { useFetch } from "@hyper-fetch/react";
import { ArrowDownToLine, ExternalLink, TerminalSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { HyperFlowReleasesData } from "../../plugins/hyperflow-releases";
import { HYPER_FLOW_RELEASES_PLUGIN } from "../../plugins/hyperflow-releases";
import type { GithubRelease, HyperFlowDownload, HyperFlowRelease, Platform } from "./releases";
import {
  detectPlatform,
  formatSize,
  getLatestHyperFlowRelease,
  HYPER_FLOW_RELEASES_API,
  HYPER_FLOW_RELEASES_PAGE,
} from "./releases";

/** The browser asks GitHub at most this often per visitor, the build-time data covers the rest */
const REFRESH_INTERVAL = 30 * 60 * 1000;
const STORAGE_KEY = "hyperflow-release";

const github = createClient({ url: "https://api.github.com" });
const getReleases = github.createRequest<{ response: GithubRelease[] }>()({
  endpoint: HYPER_FLOW_RELEASES_API.replace("https://api.github.com", ""),
  headers: { Accept: "application/vnd.github+json" },
  retry: 0,
});

type StoredRelease = { release: HyperFlowRelease; checkedAt: number };

const readStored = (): StoredRelease | null => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as StoredRelease | null;
    return stored?.release?.downloads?.length ? stored : null;
  } catch {
    return null;
  }
};

const writeStored = (release: HyperFlowRelease) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ release, checkedAt: Date.now() } satisfies StoredRelease));
  } catch {
    // Private mode or a full storage, the page works without it
  }
};

const platforms: { id: Platform; name: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: "macos", name: "macOS", Icon: AppleIcon },
  { id: "windows", name: "Windows", Icon: WindowsIcon },
  { id: "linux", name: "Linux", Icon: LinuxIcon },
];

/** Download links for the newest HyperFlow build, with the visitor's platform first. */
export const HyperFlowDownloads = () => {
  const built = usePluginData(HYPER_FLOW_RELEASES_PLUGIN) as HyperFlowReleasesData | undefined;
  const [release, setRelease] = useState<HyperFlowRelease | null>(built?.release ?? null);
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [platform, setPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    const navigatorData = navigator as Navigator & { userAgentData?: { platform?: string } };
    setPlatform(
      detectPlatform({
        userAgent: navigator.userAgent,
        platform: navigatorData.userAgentData?.platform ?? navigator.platform,
      }),
    );

    const stored = readStored();
    if (stored) {
      setRelease(stored.release);
    }
    setShouldRefresh(!stored || Date.now() - stored.checkedAt > REFRESH_INTERVAL);
  }, []);

  const { onSuccess, loading, error } = useFetch(getReleases, { disabled: !shouldRefresh });

  onSuccess(({ response }) => {
    const latest = getLatestHyperFlowRelease(response.data);
    if (latest) {
      setRelease(latest);
      writeStored(latest);
    }
  });

  const recommended = useMemo(() => {
    if (!release || !platform) {
      return null;
    }
    return release.downloads.find((download) => download.platform === platform && download.primary) ?? null;
  }, [release, platform]);

  if (!release) {
    return (
      <div className="my-8 rounded-2xl border border-zinc-700 bg-zinc-950 p-8 text-center">
        <p className="m-0 text-lg font-medium">
          {loading && shouldRefresh ? "Looking up the newest HyperFlow build..." : "Downloads are on GitHub"}
        </p>
        {!loading && (
          <p className="mt-2 text-sm text-zinc-400">
            {error ? "GitHub did not answer right now. " : ""}Every build is listed on the releases page.
          </p>
        )}
        <a className="mt-4 inline-flex items-center gap-2" href={HYPER_FLOW_RELEASES_PAGE}>
          Open GitHub releases <ExternalLink className="size-4" />
        </a>
      </div>
    );
  }

  const releaseDate = release.publishedAt
    ? new Date(release.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : null;

  return (
    <div className="my-8 flex flex-col gap-6" data-testid="hyperflow-downloads">
      <div className="relative overflow-hidden rounded-2xl border border-zinc-700 bg-gradient-to-br from-zinc-950 to-zinc-900 p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
          <span className="rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-0.5 font-medium text-yellow-400">
            v{release.version}
          </span>
          {releaseDate && <span>Released {releaseDate}</span>}
          <span aria-hidden>·</span>
          <a href={release.notesUrl} className="inline-flex items-center gap-1">
            Release notes <ExternalLink className="size-3.5" />
          </a>
        </div>

        {recommended ? (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={recommended.url}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-6 py-3 text-base font-semibold !text-zinc-950 !no-underline shadow-lg shadow-yellow-500/10 transition hover:bg-yellow-400"
              data-testid="hyperflow-recommended-download"
            >
              <ArrowDownToLine className="size-5" />
              Download for {platforms.find((item) => item.id === recommended.platform)?.name}
            </a>
            <span className="text-sm text-zinc-400">{describe(recommended)}</span>
          </div>
        ) : (
          <p className="mt-5 mb-0 text-zinc-300">HyperFlow is a desktop app. Pick the build for your computer below.</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {platforms.map(({ id, name, Icon }) => {
          // Installers first, they are what most people want
          const downloads = release.downloads
            .filter((download) => download.platform === id)
            .sort((a, b) => Number(b.primary) - Number(a.primary));
          const isCurrent = id === platform;
          return (
            <section
              key={id}
              aria-label={`${name} downloads`}
              className={[
                "flex flex-col gap-4 rounded-2xl border bg-zinc-950 p-5",
                isCurrent ? "border-yellow-500/50 ring-1 ring-yellow-500/30" : "border-zinc-800",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <Icon className="size-7 text-zinc-200" />
                <div className="flex flex-col">
                  <span className="text-lg font-semibold leading-tight">{name}</span>
                  {isCurrent && <span className="text-xs text-yellow-400">Your system</span>}
                </div>
              </div>
              {downloads.length === 0 && <p className="m-0 text-sm text-zinc-500">No build in this release yet.</p>}
              <ul className="!m-0 flex !list-none flex-col gap-2 !p-0">
                {downloads.map((download) => (
                  <li key={download.url} className="!m-0 !list-none">
                    <a
                      href={download.url}
                      className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 px-3 py-2 !text-inherit !no-underline transition hover:border-zinc-600 hover:bg-zinc-900"
                    >
                      <span className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-100">
                          {download.label} <span className="text-zinc-500">{download.format}</span>
                        </span>
                        <span className="text-xs text-zinc-500">
                          {[download.arch, formatSize(download.size)].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <ArrowDownToLine className="size-4 shrink-0 text-zinc-400" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <p className="m-0 text-sm text-zinc-400">
        Looking for another version? <a href={HYPER_FLOW_RELEASES_PAGE}>Browse all releases on GitHub</a>.
      </p>
    </div>
  );
};

const describe = (download: HyperFlowDownload) => {
  return [download.label, download.format, download.arch, formatSize(download.size)].filter(Boolean).join(" · ");
};

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.87-.76-1.47.02-2.83.86-3.6 2.18-1.53 2.66-.39 6.6 1.1 8.76.73 1.06 1.6 2.25 2.73 2.2 1.1-.04 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.41 1.2-2.47-.03-.01-2.3-.88-2.28-3.52ZM14.18 6.13c.6-.74 1.01-1.75.9-2.77-.87.04-1.93.59-2.55 1.32-.56.64-1.05 1.69-.92 2.68.97.08 1.96-.49 2.57-1.23Z" />
    </svg>
  );
}

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M3 5.48 10.37 4.5v7.06H3V5.48Zm0 13.04 7.37.98v-6.97H3v5.99Zm8.18 1.09L21 21v-8.44h-9.82v7.05Zm0-15.22v7.17H21V3l-9.82 1.39Z" />
    </svg>
  );
}

function LinuxIcon({ className }: { className?: string }) {
  return <TerminalSquare className={className} aria-hidden />;
}
