// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Hyper Fetch - Ultimate fetching solution",
  tagline: "One tool to cover your fetching requirements",
  url: "https://your-docusaurus-test-site.com",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "BetterTyped", // Usually your GitHub org/user name.
  projectName: "Hyper Fetch", // Usually your repo name.

  plugins: [
    require.resolve("@cmfcmf/docusaurus-search-local"),
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "examples",
        path: "examples",
        routeBasePath: "examples",
        sidebarPath: require.resolve("./sidebars.js"),
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "resources",
        path: "resources",
        routeBasePath: "resources",
        sidebarPath: require.resolve("./sidebars.js"),
      },
    ],
  ],

  presets: [
    [
      "@docusaurus/preset-classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: "docs",
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          editUrl: "https://github.com/facebook/docusaurus/edit/main/website/",
          lastVersion: "current",
          versions: {
            current: {
              label: "next",
              path: "next",
            },
          },
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl: "https://github.com/facebook/docusaurus/edit/main/website/blog/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
          colorMode: {
            defaultMode: "dark",
          },
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      announcementBar: {
        content: "This is <b>ALPHA</b> version, please do not use it in the production",
        backgroundColor: "var(--ifm-color-danger)",
        textColor: "black",
        isCloseable: false,
      },
      navbar: {
        title: "Hyper Fetch",
        logo: {
          alt: "Hyper Fetch",
          src: "img/logo.svg",
        },
        items: [
          {
            type: "doc",
            docId: "Getting Started/Overview",
            position: "left",
            label: "Docs",
            activeBaseRegex: `/docs/`,
          },
          {
            to: "/examples/Basic",
            label: "Examples",
            position: "left",
            activeBaseRegex: `/examples/`,
          },
          {
            to: "/resources/Community",
            label: "Resources",
            position: "left",
            activeBaseRegex: `/resources/`,
          },
          {
            to: "/blog",
            label: "Blog",
            position: "left",
          },
          {
            href: "https://github.com/graphql-go/graphql",
            label: "Github",
            position: "right",
            className: "github",
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
                label: "Getting Started",
                to: "/docs/next/Getting Started/Overview",
              },
              {
                label: "Documentation",
                to: "/docs/next/Docs/Builder",
              },
              {
                label: "Testing",
                to: "/docs/next/Testing/Setup",
              },
              {
                label: "React",
                to: "/docs/next/React/Installation",
              },
            ],
          },
          {
            title: "More",
            items: [
              {
                label: "Stack Overflow",
                href: "https://stackoverflow.com/questions/tagged/hyper-fetch",
              },
              {
                label: "Blog",
                to: "/blog",
              },
              {
                label: "GitHub",
                href: "https://github.com/BetterTyped/hyper-fetch",
              },
            ],
          },
          {
            title: "Join our newsletter",
            items: [
              {
                html: "HERE NEWSLETTER",
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} BetterTyped, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
