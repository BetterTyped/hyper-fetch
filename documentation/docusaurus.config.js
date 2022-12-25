/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");
const path = require("path");

const apiDocs = "api";

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Hyper Fetch",
  tagline: "Follow the flow of modern data exchange",
  url: "https://hyperfetch.bettertyped.com",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "BetterTyped", // Usually your GitHub org/user name.
  projectName: "Hyper Fetch", // Usually your repo name.

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
        id: "guides",
        path: "guides",
        routeBasePath: "guides",
        sidebarPath: require.resolve("./sidebars.js"),
        remarkPlugins: [require("mdx-mermaid"), require("./plugins/docusaurus-docgen").docsImporter(apiDocs)],
        lastVersion: "current",
        versions: {
          current: {
            label: "Current",
            path: "",
          },
        },
      },
    ],
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
        contentDocsOptions: {
          path: apiDocs,
          routeBasePath: apiDocs,
          sidebarPath: require.resolve("./sidebars.js"),
          lastVersion: "current",
          versions: {
            current: {
              label: "Current",
              path: "",
            },
          },
        },
      },
    ],
  ],

  presets: [
    [
      "@docusaurus/preset-classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          remarkPlugins: [require("mdx-mermaid"), require("./plugins/docusaurus-docgen").docsImporter(apiDocs)],
          routeBasePath: "docs",
          sidebarPath: require.resolve("./sidebars.js"),
          editUrl: "https://github.com/BetterTyped/hyper-fetch/tree/main/documentation",
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
            docId: "Getting Started/Overview",
            position: "left",
            label: "Docs",
            activeBaseRegex: `/docs`,
          },
          {
            to: "/api",
            label: "API",
            position: "left",
            activeBaseRegex: `/api`,
          },
          {
            to: "/guides/Basic/Setup",
            label: "Guides",
            position: "left",
            activeBaseRegex: `/guides/`,
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
            docsPluginId: "default",
          },
          {
            type: "docsVersionDropdown",
            position: "right",
            docsPluginId: "guides",
          },
          {
            type: "docsVersionDropdown",
            position: "right",
            docsPluginId: "api",
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
                to: "/docs/Getting Started/Overview",
              },
              {
                label: "Core",
                to: "/docs/Core/Builder",
              },
              {
                label: "React",
                to: "/docs/React/Overview",
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
