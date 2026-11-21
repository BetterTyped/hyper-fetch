import type { Plugin } from "@docusaurus/types";
import fs from "fs";
import matter from "gray-matter";
import path from "path";

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
};

export type ExamplesPluginData = { examples: ExampleEntry[] };

const pagesDir = path.join(__dirname, "../examples");
const examplesDir = path.join(__dirname, "../../examples");

const readCategory = (dir: string) => {
  const file = path.join(pagesDir, dir, "_category_.json");
  const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  return { label: (data.label as string) ?? dir, position: (data.position as number) ?? 99 };
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
          };
        });
    })
    .filter((example) => example.path)
    .sort((a, b) => a.categoryPosition - b.categoryPosition || a.position - b.position);

/**
 * Serves the examples to the docs:
 * - `@examples/<group>/<name>/<file>` resolves to `examples/` so pages import the real source with `!!raw-loader!`,
 *   and the docs always show the code CI builds and the sandbox providers open.
 * - The front matter of every example page is exposed as plugin data for the catalog.
 */
export default function examplesPlugin(): Plugin {
  return {
    name: "hyper-fetch-examples",
    loadContent: async () => loadExamples(),
    // Read on the client with `usePluginData("hyper-fetch-examples")` as `ExamplesPluginData`.
    contentLoaded: async ({ content, actions }) => {
      actions.setGlobalData({ examples: content });
    },
    getPathsToWatch: () => [path.join(pagesDir, "**/*.{md,mdx,json}")],
    configureWebpack: () => ({ resolve: { alias: { "@examples": examplesDir } } }),
  };
}
