import { themes as prismThemes } from "prism-react-renderer";
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
    .filter((p) => ![".DS_Store", "devtools-standalone", "devtools-react", "testing"].includes(p))
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
    // "@orama/plugin-docusaurus-v3",
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
        hasMonorepoPage: false,
      } satisfies Parameters<typeof plugin>[1],
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: "img/logo.svg",
    colorMode: {
      defaultMode: "dark",
      // disableSwitch: true,
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
          label: "Documentation",
          to: "/docs/documentation",
          activeBaseRegex: `^/docs((?!examples|integrations|api).)*$`,
        },
        {
          to: "/docs/integrations/overview",
          position: "left",
          label: "Adapters",
          activeBaseRegex: `/docs/integrations/`,
        },
        {
          to: "/docs/api/overview",
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
              to: "/docs/documentation",
            },
            {
              label: "License",
              to: "/license",
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
      theme: prismThemes.vsDark,
      darkTheme: prismThemes.vsDark,
    },
  } satisfies Preset.ThemeConfig,
};

// eslint-disable-next-line import/no-default-export
export default config;
