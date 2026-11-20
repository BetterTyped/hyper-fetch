/**
 * Keeps `examples/<group>/<name>` and the docs pages in `documentation/examples` in sync.
 *
 * Examples open straight from GitHub in StackBlitz and CodeSandbox, so each one has to install from npm on its own,
 * and each one needs exactly one docs page that points at it.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const examplesDir = path.join(root, "examples");
const pagesDir = path.join(root, "documentation", "examples");
const repo = "BetterTyped/hyper-fetch";
const levels = ["beginner", "intermediate", "advanced"];

/**
 * Tags the catalog filters on. Keep the list short: a tag earns its place when several examples share it.
 */
const tags = [
  // hooks and entry points
  "useFetch",
  "useSubmit",
  "useInfiniteFetch",
  "useCache",
  "useQueue",
  "useStream",
  "useListener",
  "useEmitter",
  "send",
  "createSdk",
  // features
  "cache",
  "params",
  "pagination",
  "optimistic",
  "invalidation",
  "offline",
  "persistence",
  "retries",
  "cancellation",
  "deduplication",
  "debounce",
  "polling",
  "prefetching",
  "suspense",
  "errors",
  "forms",
  "uploads",
  "auth",
  "validation",
  "mocking",
  "realtime",
  "streaming",
  "sync",
  "ssr",
  "typescript",
  // integrations
  "graphql",
  "axios",
  "hono",
  "nextjs",
  "devtools",
  "vanilla",
  "trpc",
  "orpc",
  "elysia",
  "openapi",
  "firebase",
  "astro",
  "router",
  "plugins",
  "testing",
  "eslint",
  "downloads",
  "server",
];

const isDir = (p) => fs.existsSync(p) && fs.statSync(p).isDirectory();

/** Examples are the second-level folders; first-level folders with a package.json are the older dev apps. */
const examples = fs
  .readdirSync(examplesDir)
  .filter(
    (group) => isDir(path.join(examplesDir, group)) && !fs.existsSync(path.join(examplesDir, group, "package.json")),
  )
  .flatMap((group) =>
    fs
      .readdirSync(path.join(examplesDir, group))
      .filter((name) => fs.existsSync(path.join(examplesDir, group, name, "package.json")))
      .map((name) => ({ group, name, id: `${group}/${name}`, dir: path.join(examplesDir, group, name) })),
  );

const walk = (dir) =>
  fs.readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return isDir(full) ? walk(full) : [full];
  });

/** The docs plugin reads front matter with gray-matter too, so both see the same values. */
const matter = createRequire(path.join(root, "documentation", "package.json"))("gray-matter");

const parsePage = (file) => {
  const source = fs.readFileSync(file, "utf8");
  const { data } = matter(source);
  const props = data.sidebar_custom_props ?? {};
  const relative = path.relative(pagesDir, file).replace(/\.mdx?$/, "");
  return {
    file: path.relative(root, file),
    route: `/examples/${data.slug ? path.join(path.dirname(relative), data.slug) : relative}`,
    source,
    title: data.title,
    description: data.description,
    path: props.path,
    level: props.level,
    tags: Array.isArray(props.tags) ? props.tags : [],
    imports: [...source.matchAll(/!!raw-loader!@examples\/([^"']+)/g)].map((match) => match[1]),
  };
};

const pages = walk(pagesDir)
  .filter((file) => /\.mdx?$/.test(file) && path.basename(file) !== "index.mdx")
  .map(parsePage);

test("there are examples and example pages", () => {
  assert.ok(examples.length > 0, "no examples found in examples/<group>/<name>");
  assert.ok(pages.length > 0, "no example pages found in documentation/examples");
});

describe("every example installs on its own", () => {
  for (const example of examples) {
    test(example.id, () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(example.dir, "package.json"), "utf8"));

      assert.equal(pkg.name, `@hyper-fetch-examples/${example.group}-${example.name}`, "package name");
      assert.equal(pkg.private, true, "examples are never published");
      assert.ok(pkg.description && pkg.description !== "TODO", "package.json needs a description");
      for (const script of ["dev", "build", "typecheck"]) {
        assert.ok(pkg.scripts?.[script], `missing "${script}" script`);
      }

      const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const [name, spec] of Object.entries(dependencies)) {
        assert.doesNotMatch(spec, /^(workspace|file|link|portal):/, `${name} must install from npm, got "${spec}"`);
        if (name.startsWith("@hyper-fetch/")) {
          // The root pnpm overrides link these to packages/* in the repo; sandboxes install the newest release.
          assert.equal(spec, "latest", `${name} must be "latest" so sandboxes match the current docs`);
        }
      }

      for (const file of ["README.md", "tsconfig.json", ".stackblitzrc", ".codesandbox/tasks.json"]) {
        assert.ok(fs.existsSync(path.join(example.dir, file)), `missing ${file}`);
      }

      const readme = fs.readFileSync(path.join(example.dir, "README.md"), "utf8");
      const tree = `${repo}/tree/main/examples/${example.id}`;
      assert.ok(readme.includes(`https://stackblitz.com/github/${tree}`), "README links StackBlitz");
      assert.ok(readme.includes(`https://codesandbox.io/s/github/${tree}`), "README links CodeSandbox");
    });
  }
});

describe("every example page points at a real example", () => {
  for (const page of pages) {
    test(page.file, () => {
      assert.ok(page.title, "front matter needs a title");
      assert.ok(page.description, "front matter needs a description, the catalog shows it");
      assert.ok(page.path, "front matter needs sidebar_custom_props.path");
      assert.ok(
        examples.some((example) => example.id === page.path),
        `sidebar_custom_props.path "${page.path}" is not a folder in examples/`,
      );
      assert.ok(levels.includes(page.level), `level must be one of ${levels.join(", ")}`);
      assert.ok(page.tags.length > 0, "front matter needs at least one tag");
      for (const tag of page.tags) {
        assert.ok(tags.includes(tag), `unknown tag "${tag}", use one of: ${tags.join(", ")}`);
      }
      assert.match(page.source, /<Example\b/, "page renders <Example>");

      assert.ok(page.imports.length > 0, "page shows at least one source file");
      for (const file of page.imports) {
        assert.ok(file.startsWith(`${page.path}/`), `${file} belongs to another example`);
        assert.ok(fs.existsSync(path.join(examplesDir, file)), `${file} does not exist`);
      }
    });
  }
});

describe("every example has exactly one page", () => {
  for (const example of examples) {
    test(example.id, () => {
      const owners = pages.filter((page) => page.path === example.id);
      assert.equal(
        owners.length,
        1,
        `expected one page, found: ${owners.map((page) => page.file).join(", ") || "none"}`,
      );

      const readme = fs.readFileSync(path.join(example.dir, "README.md"), "utf8");
      assert.ok(
        readme.includes(`https://hyperfetch.bettertyped.com${owners[0].route}`),
        `README links its docs page ${owners[0].route}`,
      );
    });
  }
});
