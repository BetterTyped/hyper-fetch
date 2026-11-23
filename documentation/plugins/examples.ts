import type { Plugin } from "@docusaurus/types";
import fs from "fs";
import matter from "gray-matter";
import path from "path";

import { getSandboxFileName } from "../src/components/example/example.utils";

/**
 * One example page as the catalog sees it. Built from the page front matter and its folder's `_category_.json`.
 */
export type ExampleEntry = {
  title: string;
  description: string;
  permalink: string;
  category: string;
  categoryPosition: number;
  position: number;
  path: string;
  level: "beginner" | "intermediate" | "advanced";
  tags: string[];
  /** Whether the example runs in the page. Only browser apps do; examples with a server open in StackBlitz. */
  preview: boolean;
};

export type ExamplesPluginData = { examples: ExampleEntry[] };

/**
 * Everything Sandpack needs to run an example in the page. Written at build time for every example that runs in the
 * browser alone, and loaded by the page only when its preview starts.
 */
export type ExampleSandbox = {
  /** Source files keyed by their absolute path in the sandbox, `index.html` included as `/public/index.html`. */
  files: Record<string, string>;
  /** `dependencies` of the example's `package.json` and their required peers. Sandpack installs them from npm. */
  dependencies: Record<string, string>;
  /** Module that `index.html` loads, for example `/src/main.tsx`. */
  entry: string;
};


const pagesDir = path.join(__dirname, "../examples");
const examplesDir = path.join(__dirname, "../../examples");

const readCategory = (dir: string) => {
  const file = path.join(pagesDir, dir, "_category_.json");
  const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  return { label: (data.label as string) ?? dir, position: (data.position as number) ?? 99 };
};

const ENTRY_SCRIPT = /<script\s+type="module"\s+src="([^"]+)"\s*><\/script>\s*/;
const TEXT_FILE = /\.(tsx?|jsx?|mjs|css|json|svg|html|md)$/;
// Config and tooling files the browser app never imports.
const IGNORED = /^(node_modules|dist|server|public|README\.md|package\.json|index\.html|vite\.config\.ts|vitest\.config\.ts|tsconfig.*\.json|\..*)$/;
// Vite's `import.meta.env` as the dev server defines it. Sandpack bundles to CommonJS, which has no `import.meta`.
const VITE_ENV = `(${JSON.stringify({ BASE_URL: "/", MODE: "development", DEV: true, PROD: false, SSR: false })})`;
const VITE_IMPORTS = new Set(["vite", "@vitejs/plugin-react"]);

type PackageJson = {
  name: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
};

const readPackageJson = (dir: string): PackageJson => JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));

const packagesDir = path.join(__dirname, "../../packages");
const hyperFetchPackages = new Map(
  fs
    .readdirSync(packagesDir)
    .filter((dir) => fs.existsSync(path.join(packagesDir, dir, "package.json")))
    .map((dir) => readPackageJson(path.join(packagesDir, dir)))
    .map((pkg) => [pkg.name, pkg]),
);

/**
 * Adds the required peers of every HyperFetch package, like npm does on install. Sandpack installs only what it is
 * given, so without this an example that relies on npm adding `@hyper-fetch/sockets` would not resolve it.
 */
const withPeers = (dependencies: Record<string, string>) => {
  const result = { ...dependencies };
  const queue = Object.keys(result);
  while (queue.length) {
    const pkg = hyperFetchPackages.get(queue.shift()!);
    Object.entries(pkg?.peerDependencies ?? {}).forEach(([name, range]) => {
      if (result[name] || pkg?.peerDependenciesMeta?.[name]?.optional) return;
      result[name] = hyperFetchPackages.has(name) ? "latest" : range;
      queue.push(name);
    });
  }
  return result;
};

const readFiles = (root: string, dir = ""): Record<string, string> =>
  Object.assign(
    {},
    ...fs.readdirSync(path.join(root, dir), { withFileTypes: true }).map((entry) => {
      const relative = path.posix.join(dir, entry.name);
      if (!dir && IGNORED.test(entry.name)) return {};
      if (entry.isDirectory()) return readFiles(root, relative);
      if (!TEXT_FILE.test(entry.name)) return {};
      return { [`/${relative}`]: fs.readFileSync(path.join(root, relative), "utf8") };
    }),
  );

/**
 * Builds the sandbox of an example that is a plain Vite app: `vite` as the dev script, no plugins besides React and no
 * server. Returns `null` for anything that needs Node, which only StackBlitz can run.
 */
const loadSandbox = (examplePath: string): ExampleSandbox | null => {
  const root = path.join(examplesDir, examplePath);
  const pkg: PackageJson & { scripts?: Record<string, string> } = readPackageJson(root);
  const viteConfig = path.join(root, "vite.config.ts");
  const html = path.join(root, "index.html");

  if (pkg.scripts?.dev !== "vite" || !fs.existsSync(html) || fs.existsSync(path.join(root, "server"))) return null;
  if (fs.existsSync(viteConfig)) {
    const imports = [...fs.readFileSync(viteConfig, "utf8").matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]);
    if (imports.some((name) => !VITE_IMPORTS.has(name))) return null;
  }

  const page = fs.readFileSync(html, "utf8");
  const entry = page.match(ENTRY_SCRIPT)?.[1];
  if (!entry) return null;

  const files = Object.fromEntries(
    Object.entries(readFiles(root)).map(([file, code]) => [file, code.replace(/import\.meta\.env/g, VITE_ENV)]),
  );
  // Anything else on `import.meta` (workers, asset URLs) needs Vite itself.
  if (Object.values(files).some((code) => code.includes("import.meta"))) return null;

  return {
    files: { ...files, "/public/index.html": page.replace(ENTRY_SCRIPT, "") },
    dependencies: withPeers(pkg.dependencies ?? {}),
    entry,
  };
};

const loadExamples = (): ExampleEntry[] =>
  fs
    .readdirSync(pagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((dir) => {
      const category = readCategory(dir.name);
      return fs
        .readdirSync(path.join(pagesDir, dir.name))
        .filter((file) => /\.mdx?$/.test(file))
        .map((file) => {
          const { data } = matter(fs.readFileSync(path.join(pagesDir, dir.name, file), "utf8"));
          const props = data.sidebar_custom_props ?? {};
          const slug = (data.slug as string | undefined) ?? file.replace(/\.mdx?$/, "");
          return {
            title: data.sidebar_label ?? data.title,
            description: data.description ?? "",
            permalink: `/examples/${dir.name}/${slug.replace(/^\//, "")}`,
            category: category.label,
            categoryPosition: category.position,
            position: data.sidebar_position ?? 99,
            path: props.path,
            level: props.level,
            tags: props.tags ?? [],
            preview: false,
          };
        });
    })
    .filter((example) => example.path)
    .sort((a, b) => a.categoryPosition - b.categoryPosition || a.position - b.position);

type ExamplesContent = { examples: ExampleEntry[]; sandboxes: Record<string, ExampleSandbox> };

const loadContent = (): ExamplesContent => {
  const examples = loadExamples();
  const sandboxes: Record<string, ExampleSandbox> = {};
  examples.forEach((example) => {
    const sandbox = sandboxes[example.path] ?? loadSandbox(example.path);
    if (sandbox) sandboxes[example.path] = sandbox;
    example.preview = !!sandbox;
  });
  return { examples, sandboxes };
};

/**
 * Serves the examples to the docs:
 * - `@examples/<group>/<name>/<file>` resolves to `examples/` so pages import the real source with `!!raw-loader!`,
 *   and the docs always show the code CI builds and the sandbox providers open.
 * - The front matter of every example page is exposed as plugin data for the catalog.
 * - Every browser-only example is written as an {@link ExampleSandbox} that the page runs with Sandpack.
 */
export default function examplesPlugin(): Plugin {
  return {
    name: "hyper-fetch-examples",
    // Read on the client with `usePluginData("hyper-fetch-examples")` as `ExamplesPluginData`.
    contentLoaded: async ({ actions }) => {
      const { examples, sandboxes } = loadContent();
      actions.setGlobalData({ examples } satisfies ExamplesPluginData);
      await Promise.all(
        Object.entries(sandboxes).map(([examplePath, sandbox]) =>
          actions.createData(getSandboxFileName(examplePath), JSON.stringify(sandbox)),
        ),
      );
    },
    getPathsToWatch: () => [
      path.join(pagesDir, "**/*.{md,mdx,json}"),
      path.join(examplesDir, "*/*/{src/**,index.html,package.json}"),
    ],
    configureWebpack: () => ({ resolve: { alias: { "@examples": examplesDir } } }),
  };
}
