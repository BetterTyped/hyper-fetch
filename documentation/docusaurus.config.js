/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");
const path = require("path");

const apiDocs = "api";
const apiDocsDir = "docs/api";

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Data fetching, caching and queueing",
  tagline: "Framework for data exchange and state management",
  url: "https://hyperfetch.bettertyped.com",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "BetterTyped",
  projectName: "Hyper Fetch",
  trailingSlash: true,

  scripts: [
    {
      src: "https://survey.survicate.com/workspaces/9f3c2b1e74133251e55420aaadfaf50d/web_surveys.js",
      async: true,
    },
  ],

  plugins: [
    "docusaurus-plugin-sass",
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "sources",
        path: "sources",
        routeBasePath: "sources",
        sidebarPath: require.resolve("./sidebars.js"),
      },
    ],
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
      "docusaurus-docgen",
      {
        id: apiDocs,
        outDir: `docs/api`,
        tsConfigPath: path.join(__dirname, "../tsconfig.base.json"),
        packages: [
          {
            logo: "/img/logo.svg",
            title: "Hyper Fetch",
            dir: path.join(__dirname, "../packages/core"),
            entryPath: "src/index.ts",
          },
          {
            logo: "/img/react.svg",
            title: "React",
            dir: path.join(__dirname, "../packages/react"),
            entryPath: "src/index.ts",
          },
          {
            logo: "/img/features/049-messenger.svg",
            title: "Sockets",
            dir: path.join(__dirname, "../packages/sockets"),
            entryPath: "src/index.ts",
          },
        ],
      },
    ],
  ],

  presets: [
    [
      "@docusaurus/preset-classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          remarkPlugins: [
            require("mdx-mermaid"),
            require("./plugins/docusaurus-docgen").docsImporter({
              packageRoute: apiDocs,
              apiDir: apiDocsDir,
            }),
          ],
          routeBasePath: "docs",
          sidebarPath: require.resolve("./sidebars.docs.js"),
          editUrl: "https://github.com/BetterTyped/hyper-fetch/tree/main/documentation",
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          lastVersion: "current",
          versions: {
            current: {
              label: "Current",
              path: "",
            },
          },
        },
        blog: {
          showReadingTime: true,
          editUrl: "https://github.com/BetterTyped/hyper-fetch/tree/main/documentation",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: "dark",
      },
      algolia: {
        appId: "E1R95VA83S",
        apiKey: "aa20780883ad65342c73e9527130a725",
        indexName: "hyperfetch",
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
            docId: "documentation/Getting Started/Overview",
            position: "left",
            label: "Docs",
            activeBaseRegex: `/docs`,
          },
          {
            to: "/docs/api",
            label: "API",
            position: "left",
            activeBaseRegex: `/docs/api`,
          },
          {
            to: "/docs/guides/Basic/Setup",
            label: "Guides",
            position: "left",
            activeBaseRegex: `/docs/guides/`,
          },
          {
            to: "/examples/Playground",
            label: "Examples",
            position: "left",
          },
          {
            to: "/sources/Overview",
            label: "Sources",
            position: "left",
            activeBaseRegex: `/sources/`,
          },
          {
            to: "/blog",
            label: "Blog",
            position: "left",
          },
          {
            type: "docsVersionDropdown",
            position: "right",
          },
          {
            href: "https://github.com/BetterTyped/hyper-fetch",
            label: "Github",
            position: "right",
            className: "github",
          },
        ],
      },
      footer: {
        style: "light",
        links: [
          {
            title: "Docs",
            items: [
              {
                label: "Getting Started",
                to: "/docs/documentation/Getting Started/Overview",
              },
              {
                label: "Core",
                to: "/docs/documentation/Core/Client",
              },
              {
                label: "React",
                to: "/docs/documentation/React/Overview",
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
                label: "BetterTyped",
                href: "https://bettertyped.com/docs/Overview",
              },
              {
                label: "Stack Overflow",
                href: "https://stackoverflow.com/questions/tagged/hyper-fetch",
              },
              {
                label: "GitHub",
                href: "https://github.com/BetterTyped/hyper-fetch",
              },
            ],
          },
          {
            title: "Join Our Newsletter!",
            items: [
              {
                html: `<!-- Begin Mailchimp Signup Form -->
                <div id="mc_embed_signup">
                  <form action="https://bettertyped.us20.list-manage.com/subscribe/post?u=9e9db92577fea9aafe98a36f1&amp;id=3ef31dfb17" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_blank" novalidate>
                      <div id="mc_embed_signup_scroll">
                    <input type="email" value="" name="EMAIL" class="email" id="mce-EMAIL" placeholder="Email address" required>
                      <!-- real people should not fill this in and expect good things - do not remove this or risk form bot signups-->
                      <div style="position: absolute; left: -5000px;" aria-hidden="true"><input type="text" name="b_9e9db92577fea9aafe98a36f1_3ef31dfb17" tabindex="-1" value=""></div>
                          <div>
                            <input type="submit" value="Subscribe" name="subscribe" id="mc-embedded-subscribe" class="button">
                          </div>
                      </div>
                      <p><a href="http://eepurl.com/hRCynH" title="Mailchimp - email marketing made easy and fun"><img class="referralBadge" src="https://eep.io/mc-cdn-images/template_images/branding_logo_text_dark_dtp.svg"></a></p>
                  </form>
                </div>

                <!--End mc_embed_signup-->`,
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
