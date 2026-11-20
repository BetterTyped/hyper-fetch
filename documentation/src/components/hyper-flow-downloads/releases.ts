/**
 * HyperFlow installers are attached to GitHub releases of the monorepo. Most releases only publish npm packages, so
 * "latest" is not enough: the newest release that carries installers is the one to download.
 */
export const HYPER_FLOW_RELEASES_API = "https://api.github.com/repos/BetterTyped/hyper-fetch/releases?per_page=100";
export const HYPER_FLOW_RELEASES_PAGE = "https://github.com/BetterTyped/hyper-fetch/releases";

export type GithubReleaseAsset = {
  name: string;
  size: number;
  browser_download_url: string;
};

export type GithubRelease = {
  tag_name: string;
  html_url: string;
  published_at: string | null;
  draft: boolean;
  prerelease: boolean;
  assets: GithubReleaseAsset[];
};

export type Platform = "macos" | "windows" | "linux";

export type HyperFlowDownload = {
  platform: Platform;
  /** e.g. "Installer", "Debian / Ubuntu" */
  label: string;
  /** File type shown to the user, e.g. ".dmg" */
  format: string;
  /** e.g. "Apple Silicon", "x64" */
  arch: string | null;
  url: string;
  size: number;
  /** The one to offer first on its platform */
  primary: boolean;
};

export type HyperFlowRelease = {
  version: string;
  publishedAt: string | null;
  notesUrl: string;
  downloads: HyperFlowDownload[];
};

const getArch = (name: string): string | null => {
  if (/arm64|aarch64/i.test(name)) {
    return "Apple Silicon";
  }
  if (/x64|x86_64|amd64/i.test(name)) {
    return "x64";
  }
  return null;
};

/** Turn an asset into a download, or `null` for files people don't download (updater feeds, bare binaries). */
export const toDownload = (asset: GithubReleaseAsset): HyperFlowDownload | null => {
  const { name } = asset;
  const base = { url: asset.browser_download_url, size: asset.size, arch: getArch(name) };

  if (name.endsWith(".dmg")) {
    return { ...base, platform: "macos", label: "Installer", format: ".dmg", primary: true };
  }
  if (/darwin/i.test(name) && name.endsWith(".zip")) {
    return { ...base, platform: "macos", label: "Archive", format: ".zip", primary: false };
  }
  if (name.endsWith(".exe")) {
    return { ...base, platform: "windows", label: "Installer", format: ".exe", primary: true };
  }
  if (/win32|windows/i.test(name) && name.endsWith(".zip")) {
    return { ...base, platform: "windows", label: "Portable", format: ".zip", primary: false };
  }
  if (name.endsWith(".deb")) {
    return { ...base, platform: "linux", label: "Debian / Ubuntu", format: ".deb", primary: true };
  }
  if (name.endsWith(".rpm")) {
    return { ...base, platform: "linux", label: "Fedora / RHEL", format: ".rpm", primary: false };
  }
  if (name.endsWith(".AppImage")) {
    return { ...base, platform: "linux", label: "AppImage", format: ".AppImage", primary: false };
  }
  if (/linux/i.test(name) && name.endsWith(".zip")) {
    return { ...base, platform: "linux", label: "Archive", format: ".zip", primary: false };
  }
  return null;
};

/** The installer builds name the version, while the tags of the monorepo follow the npm packages */
const getVersion = (release: GithubRelease) => {
  for (const { name } of release.assets) {
    const match = /(\d+\.\d+\.\d+)/.exec(name);
    if (match && match[1] !== "0.0.1") {
      return match[1];
    }
  }
  return release.tag_name.replace(/^[a-z-]*v?/i, "");
};

/** The newest published release that carries HyperFlow installers, or `null` when none does. */
export const getLatestHyperFlowRelease = (releases: GithubRelease[]): HyperFlowRelease | null => {
  const published = releases
    .filter((release) => !release.draft && !release.prerelease)
    .sort((a: GithubRelease, b: GithubRelease) => Date.parse(b.published_at ?? "") - Date.parse(a.published_at ?? ""));

  for (const release of published) {
    const downloads = release.assets
      .map(toDownload)
      .filter((download): download is HyperFlowDownload => download !== null);
    if (downloads.some((download) => download.primary)) {
      // A dmg doesn't name its architecture, the other macOS builds of the release tell it
      const macArch = downloads.find((download) => download.platform === "macos" && download.arch)?.arch ?? null;
      return {
        version: getVersion(release),
        publishedAt: release.published_at,
        notesUrl: release.html_url,
        downloads: downloads.map((download) =>
          download.platform === "macos" && !download.arch ? { ...download, arch: macArch } : download,
        ),
      };
    }
  }
  return null;
};

/** The visitor's platform from the browser, `null` when it is not a desktop one HyperFlow runs on. */
export const detectPlatform = ({
  userAgent,
  platform = "",
}: {
  userAgent: string;
  platform?: string;
}): Platform | null => {
  const source = `${platform} ${userAgent}`;
  if (/iphone|ipad|ipod|android/i.test(source)) {
    return null;
  }
  if (/mac/i.test(source)) {
    return "macos";
  }
  if (/win/i.test(source)) {
    return "windows";
  }
  if (/linux|x11|cros/i.test(source)) {
    return "linux";
  }
  return null;
};

export const formatSize = (bytes: number) => {
  if (!bytes) {
    return null;
  }
  const megabytes = bytes / 1024 / 1024;
  return `${megabytes >= 100 ? Math.round(megabytes) : megabytes.toFixed(1)} MB`;
};
