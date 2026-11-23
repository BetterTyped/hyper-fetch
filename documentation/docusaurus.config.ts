import { importer } from "@docsgen/core";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import plugin from "@docsgen/docusaurus";
import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { convertNpmToPackageManagers } from "@sapphire/docusaurus-plugin-npm2yarn2pnpm";
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

import examplesPlugin from "./plugins/examples";
import hyperFlowReleasesPlugin from "./src/plugins/hyperflow-releases";
import sponsorsPlugin from "./src/plugins/sponsors";
import llmsTxtPlugin from "./src/plugins/llms-txt";
import docsVersions from "./versions.json";

/**
 * `versions.json` lists the frozen majors the site builds, newest first. `pnpm docs:version` adds one before
 * every major release and keeps only the newest two, so the site builds three versions. The docs in `docs/`
 * are always the major after the newest frozen one. Older snapshots stay in `versioned_docs` unbuilt.
 */
/**
 * The newest released tag of a major, like `v10.4.1`. Without tags (a shallow clone) or before the major's first
 * release it is just the major, like `v10`, so the label never names a release that does not exist.
 */
const getReleaseLabel = (major: number) => {
  try {
    const [latest] = execFileSync("git", ["tag", "--list", `v${major}.*`, "--sort=-v:refname"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split("\n")
      .map((tag) => tag.trim())
      .filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag));
    return latest ?? `v${major}`;
  } catch {
    return `v${major}`;
  }
};

const getMajor = (version: string) => Number(/^v(\d+)\./.exec(version)?.[1] ?? 0);

const getVersions = () => {
  const [newestFrozen = "v0.0.0"] = docsVersions;
  const currentMajor = getMajor(newestFrozen) + 1;
  const versions: Record<
    string,
    { label?: string; path?: string; noIndex?: boolean }
  > = {
    current: { label: getReleaseLabel(currentMajor), path: "" },
  };

  docsVersions.forEach((version) => {
    versions[version] = { label: getReleaseLabel(getMajor(version)), noIndex: true };
  });

  return versions;
};

const apiDocs = "api";
const apiDocsDir = "docs/api";

const getPackagesList = () => {
  const dirPath = path.join(__dirname, "../packages");
  const result: string[] = fs
    .readdirSync(dirPath)
    .filter((p) => ![".DS_Store", "hyper-flow", "testing"].includes(p))
    .map((filePath) => {
      return path.join(dirPath, filePath);
    });

  return (
    result
      .filter((item) => !item.includes("tokens"))
      // A folder left behind by another branch (only dist or node_modules) has no sources to document
      .filter((item) => fs.existsSync(path.join(item, "src/index.ts")))
      .map((dir) => {
        const title = path.basename(dir);

        return {
          title,
          dir,
          entryPath: "src/index.ts",
          tsconfigDir: dir,
        };
      })
  );
};

/**
 * *****
 * Configs
 * *****
 */

const config: Config = {
  title: "HyperFetch",
  tagline:
    "Typed requests, caching, offline queues, upload progress and websockets for TypeScript and React. One API over fetch, Axios, GraphQL and Firebase.",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: "https://hyperfetch.bettertyped.com/",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",
  // S3 serves every page as `<path>/index.html` and answers the slashless URL
  // with a 302 to the slash one. Without this, sitemap and canonical URLs point
  // at that redirect and Google sees two URLs for every page.
  trailingSlash: true,

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "BetterTyped", // Usually your GitHub org/user name.
  projectName: "HyperFetch", // Usually your repo name.

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  future: {
    // Same as `faster: true` but Webpack for client/server bundles. Rspack has
    // been observed to finish without writing `build/__server/server.bundle.js`,
    // which breaks SSG with ENOENT when loading the server bundle.
    faster: {
      swcJsLoader: true,
      swcJsMinimizer: true,
      swcHtmlMinimizer: true,
      lightningCssMinimizer: true,
      mdxCrossCompilerCache: true,
      rspackBundler: false,
      rspackPersistentCache: false,
      ssgWorkerThreads: true,
      gitEagerVcs: true,
    },
    v4: {
      removeLegacyPostBuildHeadAttribute: true, // required
      useCssCascadeLayers: false,
    },
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  scripts: [],

  headTags: [
    {
      tagName: "link",
      attributes: {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700;800;900&family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap",
      },
    },
  ],

  presets: [
    [
      "classic",
      {
        // SVGO shortens every id to a, b, c, so two inline SVGs on one page point at each other's gradients and masks.
        // Prefixing the ids with the file name keeps them unique (facebook/docusaurus#8297).
        svgr: {
          svgrConfig: {
            svgoConfig: {
              plugins: [
                {
                  name: "preset-default",
                  params: { overrides: { removeTitle: false, removeViewBox: false } },
                },
                "prefixIds",
              ],
            },
          },
        },
        docs: {
          lastVersion: "current",
          versions: getVersions(),
          sidebarCollapsible: false,
          sidebarCollapsed: false,
          sidebarPath: "./sidebars.ts",
          editUrl:
            "https://github.com/BetterTyped/hyper-fetch/tree/main/documentation",
          remarkPlugins: [
            convertNpmToPackageManagers,
            importer({
              packageRoute: apiDocs,
              apiDir: apiDocsDir,
            }),
          ],
        },
        blog: {
          showReadingTime: true,
          editUrl:
            "https://github.com/BetterTyped/hyper-fetch/tree/main/documentation",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    "@docsearch/docusaurus-adapter",
    hyperFlowReleasesPlugin,
    sponsorsPlugin,
    llmsTxtPlugin,
    "docusaurus-plugin-sass",
    async function tailwindPlugin() {
      return {
        name: "docusaurus-tailwindcss",
        configurePostCss(postcssOptions) {
          // Appends TailwindCSS and AutoPrefixer.
          // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
          postcssOptions.plugins.push(require("postcss-import"));
          // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
          postcssOptions.plugins.push(require("tailwindcss"));
          // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
          postcssOptions.plugins.push(require("autoprefixer"));
          return postcssOptions;
        },
      };
    },
    examplesPlugin,
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "examples",
        path: "examples",
        routeBasePath: "examples",
        sidebarPath: require.resolve("./sidebars.examples.js"),
      },
    ],
    [
      "@docsgen/docusaurus",
      {
        id: apiDocs,
        outDir: `docs/api`,
        packages: getPackagesList(),
        logLevel: "trace",
        addMonorepoPage: false,
        addPackagePage: false,
      } satisfies Parameters<typeof plugin>[1],
    ],
  ],

  themes: ["@docusaurus/theme-mermaid"],

  // In order for Mermaid code blocks in Markdown to work,
  // you also need to enable the Remark plugin with this option
  markdown: {
    mermaid: true,
  },

  themeConfig: {
    // PNG, not SVG: X, LinkedIn and Facebook do not render SVG previews.
    image: "img/social-card.png",
    docsearch: {
      appId: process.env.DOC_APP_ID || "dummy_value",
      apiKey: process.env.DOC_API_KEY || "dummy_value",
      indexName: process.env.DOC_INDEX_NAME || "dummy_value",
      askAi: {
        assistantId: process.env.DOC_ASSISTANT_ID || "dummy_value",
        agentStudio: true,
      },
      contextualSearch: true,
      translations: {
        button: { buttonText: "Search docs", buttonAriaLabel: "Search docs" },
      },
    },
    colorMode: {
      defaultMode: "dark",
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    liveCodeBlock: {
      playgroundPosition: "bottom",
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 3,
    },
    navbar: {
      title: "",
      logo: {
        alt: "HyperFetch Logo",
        src: "img/brand/HF.svg",
      },
      items: [
        // Rendered right after the logo, so the version reads as part of the brand
        {
          type: "custom-versionTag",
          position: "left",
          to: "/blog/hyper-fetch-10-0",
          label: "v10",
        },
        {
          position: "left",
          label: "Docs",
          to: "/docs/getting-started",
          activeBaseRegex: `^/docs((?!examples|integrations|guides|api).)*$`,
        },
        {
          to: "/docs/integrations/getting-started",
          position: "left",
          label: "Integrations",
          activeBaseRegex: `/docs/integrations/`,
        },
        {
          to: "/docs/guides/getting-started",
          position: "left",
          label: "Guides",
          activeBaseRegex: `/docs/guides/`,
        },
        {
          to: "/docs/api/getting-started",
          position: "left",
          label: "Api",
          activeBaseRegex: `/docs/api/`,
        },
        {
          to: "/examples/",
          label: "Examples",
          position: "left",
        },
        {
          to: "/blog",
          position: "left",
          label: "Blog",
        },
        // {
        //   href: "https://github.com/BetterTyped/hyper-fetch",
        //   label: "Github",
        //   position: "right",
        //   className: "github",
        // },
        {
          type: "search",
          position: "right",
          className: "navbar-search",
        },
        {
          type: "custom-githubStarButton",
          position: "right",
          owner: "BetterTyped",
          repo: "hyper-fetch",
          fallbackStars: 1300,
          variant: "navbar",
        },
        // {
        //   type: "docsVersionDropdown",
        //   position: "right",
        //   dropdownActiveClassDisabled: true,
        //   docsPluginId: "default",
        //   className: "nav_versioning",
        // },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            { label: "Getting started", to: "/docs/getting-started/" },
            { label: "React", to: "/docs/react/overview/" },
            { label: "WebSockets and SSE", to: "/docs/sockets/overview/" },
            {
              label: "OpenAPI client",
              to: "/docs/cli/openapi-typescript-client/",
            },
            {
              label: "Migrating from React Query",
              to: "/docs/guides/react/basics/migrating-from-react-query/",
            },
          ],
        },
        {
          title: "Compare",
          items: [
            {
              label: "Data fetching libraries",
              to: "/docs/guides/comparisons/",
            },
            {
              label: "vs TanStack Query",
              to: "/docs/guides/comparisons/tanstack-query/",
            },
            { label: "vs SWR", to: "/docs/guides/comparisons/swr/" },
            {
              label: "vs RTK Query",
              to: "/docs/guides/comparisons/rtk-query/",
            },
            {
              label: "Axios vs fetch",
              to: "/docs/guides/comparisons/axios-vs-fetch/",
            },
          ],
        },
        {
          title: "Guides",
          items: [
            {
              label: "SSE vs WebSocket",
              to: "/docs/guides/sockets/sse-vs-websocket/",
            },
            {
              label: "WebSockets in React",
              to: "/docs/guides/sockets/websockets-in-react/",
            },
            {
              label: "File upload progress",
              to: "/docs/guides/react/basics/progress/",
            },
            {
              label: "Next.js data fetching",
              to: "/docs/guides/react/basics/nextjs-data-fetching/",
            },
            {
              label: "Optimistic updates",
              to: "/docs/guides/react/basics/optimistic-approach/",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "Stack Overflow",
              href: "https://stackoverflow.com/questions/tagged/HyperFetch",
            },
            {
              label: "Github",
              href: "https://github.com/BetterTyped/hyper-fetch",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "Blog",
              to: "/blog",
            },
            {
              label: "Hype Stack",
              href: "https://hype-stack.dev",
            },
            {
              label: "BetterTyped",
              href: "https://bettertyped.com",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} BetterTyped.`,
    },
    prism: {
      magicComments: [
        {
          className: "code-block-diff-add-line",
          line: "diff-add-next-line",
          block: { start: "diff-add-start", end: "diff-add-end" },
        },
        {
          className: "code-block-diff-remove-line",
          line: "diff-remove-next-line",
          block: { start: "diff-remove-start", end: "diff-remove-end" },
        },
        {
          className: "theme-code-block-highlighted-line",
          line: "highlight-next-line",
          block: { start: "highlight-start", end: "highlight-end" },
        },
        {
          className: "code-block-error-line",
          line: "error-next-line",
          block: { start: "error-start", end: "error-end" },
        },
        {
          className: "code-block-code-editor-split",
          line: "code-editor-split",
        },
      ],
      theme: {
        plain: {},
        styles: [
          {
            types: ["constructor"],
            style: { color: "rgb(255, 255, 255)" },
          },
        ],
      },
      darkTheme: {
        plain: {},
        styles: [
          {
            types: ["constructor"],
            style: { color: "rgb(255, 255, 255)" },
          },
        ],
      },
    },
  } satisfies Preset.ThemeConfig,
};

// eslint-disable-next-line import/no-default-export
export default config;
