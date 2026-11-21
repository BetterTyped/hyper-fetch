import type { LoadedContent } from "@docusaurus/plugin-content-docs";
import type { LoadContext, Plugin } from "@docusaurus/types";
import fs from "fs";
import path from "path";

export const LLMS_TXT_PLUGIN = "llms-txt";

type DocLink = { title: string; description: string; permalink: string };

/**
 * Sections in the order an assistant should read them. The first prefix that matches a page wins, so the narrow
 * comparisons prefix sits before the guides one.
 */
const SECTIONS: { title: string; prefix: string }[] = [
  { title: "Getting started", prefix: "/docs/getting-started/" },
  { title: "Core", prefix: "/docs/core/" },
  { title: "React", prefix: "/docs/react/" },
  { title: "Sockets (WebSocket and SSE)", prefix: "/docs/sockets/" },
  { title: "CLI and OpenAPI", prefix: "/docs/cli/" },
  { title: "Comparisons", prefix: "/docs/guides/comparisons/" },
  { title: "Guides", prefix: "/docs/guides/" },
  { title: "Integrations", prefix: "/docs/integrations/" },
  { title: "HyperFlow devtools", prefix: "/docs/hyper-flow/" },
];

/** The generated API reference has hundreds of one-symbol pages. It is linked once, not page by page. */
const API_REFERENCE = "/docs/api/getting-started/";

export const renderLlmsTxt = (siteUrl: string, tagline: string, docs: DocLink[]): string => {
  // Docs permalinks come without the trailing slash the site serves (trailingSlash: true), and the slashless URL is
  // a redirect. Link the served URL.
  const url = (permalink: string) => new URL(permalink.endsWith("/") ? permalink : `${permalink}/`, siteUrl).toString();
  const lines = [
    "# HyperFetch",
    "",
    `> ${tagline}`,
    "",
    "HyperFetch is a TypeScript framework for HTTP, GraphQL, Firebase and realtime (WebSocket and SSE) requests, with React hooks. Packages are published under the `@hyper-fetch/*` scope on npm.",
    "",
  ];

  SECTIONS.forEach((section) => {
    const pages = docs.filter(
      (doc) => SECTIONS.find((candidate) => doc.permalink.startsWith(candidate.prefix)) === section,
    );
    if (!pages.length) return;
    lines.push(`## ${section.title}`, "");
    pages.forEach((doc) => {
      lines.push(`- [${doc.title}](${url(doc.permalink)})${doc.description ? `: ${doc.description}` : ""}`);
    });
    lines.push("");
  });

  lines.push("## Optional", "", `- [API reference](${url(API_REFERENCE)}): generated reference for every export`, "");
  return lines.join("\n");
};

/**
 * Writes `llms.txt` (https://llmstxt.org) from the current docs version on every build, so assistants that read it
 * get the same titles and descriptions as search engines and it can never drift from the docs.
 */
export default function llmsTxtPlugin(context: LoadContext): Plugin<unknown> {
  let docs: DocLink[] = [];

  return {
    name: LLMS_TXT_PLUGIN,
    async allContentLoaded({ allContent }) {
      const content = allContent["docusaurus-plugin-content-docs"]?.default as LoadedContent | undefined;
      const current = content?.loadedVersions.find((version) => version.versionName === "current");
      docs = (current?.docs ?? [])
        .filter((doc) => !doc.unlisted && !doc.permalink.startsWith("/docs/api/"))
        .map((doc) => ({ title: doc.title, description: doc.description, permalink: doc.permalink }))
        .sort((a, b) => a.permalink.localeCompare(b.permalink));
    },
    async postBuild({ outDir }) {
      const { url, tagline } = context.siteConfig;
      fs.writeFileSync(path.join(outDir, "llms.txt"), renderLlmsTxt(url, tagline, docs));
    },
  };
}
