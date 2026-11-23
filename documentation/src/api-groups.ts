import type { Section } from "./modules";
import { modules } from "./modules";

/*
 * The API reference groups its packages by role, for the package picker at the top of the API sidebar. A package
 * joins the first group that matches it; anything no group matches lands in "More", so a new package is never dropped.
 */

export type ApiGroup = {
  title: string;
  /** Label for tight spaces, like the category chips of the picker */
  short: string;
  match: (section: Section) => boolean;
};

export const apiGroups: ApiGroup[] = [
  {
    title: "Core packages",
    short: "Core",
    match: (section) => modules.includes(section),
  },
  {
    title: "Adapters",
    short: "Adapters",
    match: (section) => section.category === "Adapter",
  },
  {
    title: "Backend frameworks",
    short: "Backends",
    match: (section) => section.category === "Service",
  },
  {
    title: "Plugins",
    short: "Plugins",
    match: (section) => section.category === "Plugin",
  },
];

export const apiMoreGroup: ApiGroup = {
  title: "More",
  short: "More",
  match: () => true,
};

/** The group a package is listed under */
export const apiGroupOf = (section: Section): ApiGroup =>
  apiGroups.find((group) => group.match(section)) ?? apiMoreGroup;

/** Position of a package's group, for sorting packages into group order */
export const apiGroupIndexOf = (section: Section): number => {
  const index = apiGroups.indexOf(apiGroupOf(section));
  return index === -1 ? apiGroups.length : index;
};
