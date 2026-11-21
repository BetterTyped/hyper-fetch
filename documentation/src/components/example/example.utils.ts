/**
 * Examples live in `examples/<group>/<name>` of the repository. Sandbox providers import them straight from GitHub,
 * so the docs never hold a copy that can drift from the code that CI builds.
 */
export const EXAMPLES_REPOSITORY = "BetterTyped/hyper-fetch";
export const EXAMPLES_BRANCH = "main";

const examplePath = (path: string) => `examples/${path}`;

export const getGithubUrl = (path: string) =>
  `https://github.com/${EXAMPLES_REPOSITORY}/tree/${EXAMPLES_BRANCH}/${examplePath(path)}`;

export const getStackblitzUrl = (path: string, file?: string) => {
  const params = new URLSearchParams();
  if (file) params.set("file", file);
  const query = params.toString();
  return `https://stackblitz.com/github/${EXAMPLES_REPOSITORY}/tree/${EXAMPLES_BRANCH}/${examplePath(path)}${
    query ? `?${query}` : ""
  }`;
};

const STACKBLITZ_ORIGIN = "https://stackblitz.com";

/**
 * Embedded StackBlitz runs the example in a WebContainer, which needs `crossOriginIsolated`. A cross-origin iframe only
 * gets it when all three hold, otherwise StackBlitz shows "Unable to run Embedded Project":
 *
 * 1. The docs page itself is cross-origin isolated (`Cross-Origin-Opener-Policy: same-origin` and
 *    `Cross-Origin-Embedder-Policy: credentialless`), which is up to the host serving the docs.
 * 2. The iframe delegates `cross-origin-isolated` to StackBlitz ({@link STACKBLITZ_IFRAME_ALLOW}).
 * 3. The embed URL has `corp=1`, so StackBlitz serves headers an isolated page accepts.
 *
 * `@stackblitz/sdk` does 2 and 3 with its `crossOriginIsolated` option. Only Chromium browsers support it.
 */
export const canEmbedStackblitz = () => typeof window !== "undefined" && window.crossOriginIsolated === true;

/** Permissions the embed iframe delegates to StackBlitz. */
export const STACKBLITZ_IFRAME_ALLOW = [
  `cross-origin-isolated ${STACKBLITZ_ORIGIN}`,
  `clipboard-read ${STACKBLITZ_ORIGIN}`,
  `clipboard-write ${STACKBLITZ_ORIGIN}`,
].join("; ");

export const getStackblitzEmbedUrl = (path: string, file?: string) => {
  const params = new URLSearchParams({
    embed: "1",
    corp: "1",
    theme: "dark",
    view: "preview",
    hideNavigation: "1",
  });
  if (file) params.set("file", file);
  return `https://stackblitz.com/github/${EXAMPLES_REPOSITORY}/tree/${EXAMPLES_BRANCH}/${examplePath(
    path,
  )}?${params.toString()}`;
};

export const getCodesandboxUrl = (path: string, file?: string) => {
  const params = new URLSearchParams();
  if (file) params.set("file", `/${file}`);
  const query = params.toString();
  return `https://codesandbox.io/s/github/${EXAMPLES_REPOSITORY}/tree/${EXAMPLES_BRANCH}/${examplePath(path)}${
    query ? `?${query}` : ""
  }`;
};

const languages: Record<string, string> = {
  ts: "ts",
  tsx: "tsx",
  js: "js",
  jsx: "jsx",
  mjs: "js",
  css: "css",
  json: "json",
  html: "html",
  md: "md",
};

export const getLanguage = (file: string) => languages[file.split(".").pop() ?? ""] ?? "text";

/** Copies the example folder without git history, then installs and starts it. */
export const getDownloadCommand = (path: string) => {
  const name = `hyper-fetch-${path.replace(/\//g, "-")}`;
  return `npx tiged ${EXAMPLES_REPOSITORY}/${examplePath(path)} ${name} && cd ${name} && npm install && npm run dev`;
};
