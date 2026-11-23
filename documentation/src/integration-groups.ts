import type { LucideIcon } from "lucide-react";
import {
  Cpu,
  Database,
  Layers,
  Server,
  Smartphone,
  Sparkles,
  Wrench,
} from "lucide-react";

import type { Section } from "./modules";

/*
 * Integrations grouped by what the reader is connecting rather than by package type. The integrations overview and
 * the integration picker in the sidebar both use these groups. A section joins the first group that matches it;
 * anything no group matches lands in "More", so a new integration is never dropped.
 */

export type IntegrationGroup = {
  id: string;
  title: string;
  /** Label for tight spaces, like the category chips of the integration picker */
  short: string;
  line: string;
  icon: LucideIcon;
  match: (section: Section) => boolean;
};

const backends = ["tRPC", "oRPC", "Hono", "Elysia"];

export const integrationGroups: IntegrationGroup[] = [
  {
    id: "backends",
    title: "Typed from your backend",
    short: "Backends",
    line: "The client reads its types from your server code. No schema to write, no code to generate.",
    icon: Server,
    match: (section) => backends.includes(section.label),
  },
  {
    id: "apis",
    title: "APIs and data",
    short: "APIs",
    line: "GraphQL, Firebase and Axios behind the same request API, cache and hooks.",
    icon: Database,
    match: (section) => section.category === "Adapter",
  },
  {
    id: "frameworks",
    title: "Server frameworks",
    short: "Frameworks",
    line: "Call a backend in any language through a typed SDK generated from its OpenAPI document.",
    icon: Layers,
    match: (section) => section.category === "Framework",
  },
  {
    id: "runtimes",
    title: "Runtimes",
    short: "Runtimes",
    line: "Run the same client on Node.js, Bun, Deno and the edge.",
    icon: Cpu,
    match: (section) => section.category === "Runtime",
  },
  {
    id: "apps",
    title: "Mobile and desktop",
    short: "Apps",
    line: "Use HyperFetch and its React hooks outside the browser.",
    icon: Smartphone,
    match: (section) => section.category === "Native",
  },
  {
    id: "tooling",
    title: "Tooling and monitoring",
    short: "Tooling",
    line: "Lint rules, devtools and error reporting for your requests.",
    icon: Wrench,
    match: (section) =>
      section.category === "Plugin" || section.category === "Monitoring",
  },
];

export const moreGroup: IntegrationGroup = {
  id: "more",
  title: "More",
  short: "More",
  line: "Other integrations.",
  icon: Sparkles,
  match: () => true,
};

/** The group a section is listed under */
export const groupOf = (section: Section): IntegrationGroup =>
  integrationGroups.find((group) => group.match(section)) ?? moreGroup;

/** Position of a section's group, for sorting sections into group order */
export const groupIndexOf = (section: Section): number => {
  const index = integrationGroups.indexOf(groupOf(section));
  return index === -1 ? integrationGroups.length : index;
};
