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

/**
 * Name of the data file that holds the Sandpack setup of an example, written by the examples plugin at build time and
 * imported from `@generated/hyper-fetch-examples/default/` when the preview starts.
 */
export const getSandboxFileName = (path: string) => `sandbox-${path.replace(/\//g, "-")}.json`;

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
