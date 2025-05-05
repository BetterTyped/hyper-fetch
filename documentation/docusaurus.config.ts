import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import path from "path";
import fs from "fs";
import plugin from "@docsgen/docusaurus";
import { importer } from "@docsgen/core";

import docsVersions from "./versions.json";

const getVersions = () => {
  const latestVersion = docsVersions[0] || "v0.0.0";
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
    .filter((p) => ![".DS_Store", "plugin-devtools", "hyper-flow", "testing"].includes(p))
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
  tagline: "Take the HyperFetch.",
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
    experimental_faster: true,
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
    "@docusaurus/theme-live-codeblock",
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
          activeBaseRegex: `^/docs((?!examples|integrations|guides|api|hyper-flow).)*$`,
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
          type: "docsVersionDropdown",
          position: "right",
          dropdownActiveClassDisabled: true,
          docsPluginId: "default",
          className: "nav_versioning",
        },
        {
          href: "https://github.com/BetterTyped/hyper-fetch",
          label: "Github",
          position: "right",
          className: "github",
        },
        {
          to: "/docs/hyper-flow",
          position: "right",
          html: `
          <span class='shiny-btn flex items-center gap-2 !rounded-lg px-3 py-1 text-sm'>
            <svg data-v-14c8c335="" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path></svg>
            Hyper Flow
          </span>`,
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
