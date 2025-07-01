import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import path from "path";
import fs from "fs";
import plugin from "@docsgen/docusaurus";
import { importer } from "@docsgen/core";
import { convertNpmToPackageManagers } from "@sapphire/docusaurus-plugin-npm2yarn2pnpm";

import docsVersions from "./versions.json";

const getVersions = () => {
  const latestVersion = docsVersions[0] || "v7.0.0";
  const latestMajor = latestVersion[1];
  const currentVersion = Number(latestMajor) + 1;
  const versions = { current: { label: `v${currentVersion}.0.0`, path: "" } };

  [...Array(docsVersions.length)].fill(0).forEach((_, index) => {
    const version = Number(latestMajor) - index;

    if (currentVersion === version) {
      versions.current = {
        label: `v${version}.0.0`,
        path: "",
      };
    } else {
      versions[`v${version}.0.0`] = {
        noIndex: true,
      };
    }
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

  return result
    .filter((item) => !item.includes("tokens"))
    .map((dir) => {
      const dirName = dir.split("/").pop();
      const title = dirName[0] + dirName.slice(1);

      return {
        title,
        dir,
        entryPath: "src/index.ts",
        tsconfigDir: dir,
      };
    });
};

/**
 * *****
 * Configs
 * *****
 */

const config: Config = {
  title: "HyperFetch",
  tagline: "Use HyperFetch today.",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: "https://hyperfetch.bettertyped.com/",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "BetterTyped", // Usually your GitHub org/user name.
  projectName: "HyperFetch", // Usually your repo name.

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  future: {
    v4: {
      removeLegacyPostBuildHeadAttribute: true, // required
      useCssCascadeLayers: false,
    },
    experimental_faster: {
      rspackBundler: true,
      rspackPersistentCache: true,
      ssgWorkerThreads: true,
      swcJsLoader: true,
      swcJsMinimizer: true,
      swcHtmlMinimizer: true,
      lightningCssMinimizer: true,
      mdxCrossCompilerCache: true,
    },
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  scripts: [
    {
      src: "/js/theme.js",
      async: false,
    },
  ],

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
        docs: {
          lastVersion: "current",
          versions: getVersions(),
          sidebarCollapsible: false,
          sidebarCollapsed: false,
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/BetterTyped/hyper-fetch/tree/main/documentation",
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
          editUrl: "https://github.com/BetterTyped/hyper-fetch/tree/main/documentation",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    "docusaurus-plugin-sass",
    async function tailwindPlugin() {
      return {
        name: "docusaurus-tailwindcss",
        configurePostCss(postcssOptions) {
          // Appends TailwindCSS and AutoPrefixer.
          // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
          postcssOptions.plugins.push(require("tailwindcss"));
          // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
          postcssOptions.plugins.push(require("autoprefixer"));
          return postcssOptions;
        },
      };
    },
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
    // Replace with your project's social card
    image: "img/logo.svg",
    algolia: {
      appId: "E1R95VA83S",
      apiKey: "aa20780883ad65342c73e9527130a725",
      indexName: "hyperfetch",
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
          to: "/examples/playground/",
          label: "Examples",
          position: "left",
        },
        {
          to: "/blog",
          position: "left",
          label: "Blog",
        },
        {
          href: "https://github.com/BetterTyped/hyper-fetch",
          label: "Github",
          position: "right",
          className: "github",
        },
        // {
        //   type: "docsVersionDropdown",
        //   position: "right",
        //   dropdownActiveClassDisabled: true,
        //   docsPluginId: "default",
        //   className: "nav_versioning",
        // },
        {
          type: "custom-myButton",
          to: "/docs/hyper-flow/download",
          position: "right",
          children: "Get Devtools Access",
          navbarIcon: true,
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Documentation",
              to: "/docs/getting-started",
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
