import { usePluginData } from "@docusaurus/useGlobalData";
import { useMemo, useSyncExternalStore } from "react";

import type { ExampleEntry, ExamplesPluginData } from "../plugins/examples";
import type { SidebarItem } from "./hooks/use-sidebar";
import { integrations } from "./integrations";
import type { Section } from "./modules";
import { modules } from "./modules";
import { npmNameOf } from "./utils/npm-name";

/*
 * The examples sidebar can show only the examples that use one package or integration. The choice is kept in
 * localStorage, so it stays while the reader moves between examples, and every sidebar reads it from this store.
 */

const STORAGE_KEY = "hyper-fetch-examples-filter";

/** Dependencies that are not HyperFetch packages but tell which framework an example is built on */
const frameworkDependencies: Record<string, string> = {
  next: "nextjs",
  astro: "astro",
  "react-router": "react-router",
  "@tanstack/react-router": "tanstack-start",
  "@tanstack/react-start": "tanstack-start",
};

const packageSections = modules.filter((section) => section.isPackage);
const integrationSections = integrations.filter((section) => section.dir !== "getting-started");
const sections = [...packageSections, ...integrationSections];

/** The sections an example belongs to, read from its dependencies */
export const sectionDirsOf = (example: ExampleEntry): string[] => {
  const dirs = example.dependencies.flatMap((dependency) => {
    const section = sections.find((candidate) => npmNameOf(candidate) === dependency);
    if (section) return [section.dir];
    const framework = frameworkDependencies[dependency];
    return framework ? [framework] : [];
  });
  return [...new Set(dirs)];
};

/** Where a filter is listed in the picker: packages first, then integrations, then frontend frameworks */
export const filterGroups = [
  { title: "Packages", short: "Packages", match: (section: Section) => packageSections.some((item) => item.dir === section.dir) },
  { title: "Frameworks", short: "Frameworks", match: (section: Section) => section.category === "Frontend" },
  { title: "Integrations", short: "Integrations", match: () => true },
];

export const filterGroupIndexOf = (section: Section) => filterGroups.findIndex((group) => group.match(section));

// Store

let current: string | null = null;
let loaded = false;
const listeners = new Set<() => void>();

const read = () => {
  if (!loaded) {
    loaded = true;
    try {
      current = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      current = null;
    }
  }
  return current;
};

/** Shows only the examples of a section, by its `dir`, or every example with `null` */
export const setExamplesFilter = (dir: string | null) => {
  current = dir;
  loaded = true;
  try {
    if (dir) window.localStorage.setItem(STORAGE_KEY, dir);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private windows can refuse storage. The filter still works until the page reloads.
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** The `dir` of the section the examples are filtered by, or `null`. Always `null` on the server. */
export const useExamplesFilter = () => useSyncExternalStore(subscribe, read, () => null);

const trimSlash = (path: string) => path.replace(/\/$/, "");

export const useExamples = () => (usePluginData("hyper-fetch-examples") as ExamplesPluginData).examples;

/** Permalinks of the examples the current filter keeps, or `null` when every example shows */
export const useFilteredExamplePaths = (): Set<string> | null => {
  const examples = useExamples();
  const filter = useExamplesFilter();
  return useMemo(() => {
    if (!filter) return null;
    return new Set(
      examples
        .filter((example) => sectionDirsOf(example).includes(filter))
        .map((example) => trimSlash(example.permalink)),
    );
  }, [examples, filter]);
};

/** Whether the sidebar link of an example page passes the filter */
export const keepsExampleLink = (href: string | undefined, paths: Set<string> | null) => {
  if (!paths || !href) return true;
  const path = trimSlash(href);
  // The catalog (`/examples`) always stays
  return !path.startsWith("/examples/") || paths.has(path);
};

const overviewSection = integrations.find((section) => section.dir === "getting-started")!;

/**
 * The filters as picker entries: "All examples" first, then every package and integration at least one example uses,
 * with the number of its examples.
 */
export const useExampleFilterItems = () => {
  const examples = useExamples();
  const filter = useExamplesFilter();
  return useMemo(() => {
    const counts = new Map<string, number>();
    examples.forEach((example) =>
      sectionDirsOf(example).forEach((dir) => counts.set(dir, (counts.get(dir) ?? 0) + 1)),
    );
    const overview: SidebarItem = {
      name: "All examples",
      description: `Every runnable example, ${examples.length} in all.`,
      index: -1,
      link: { path: "/examples/", label: "All examples" },
      img: overviewSection.img,
      active: !filter,
      section: { ...overviewSection, label: "All examples" },
    };
    const items = sections
      .filter((section) => counts.has(section.dir))
      .map(
        (section, index): SidebarItem => ({
          name: section.label,
          description: `${counts.get(section.dir)} ${counts.get(section.dir) === 1 ? "example uses" : "examples use"} it. ${section.description}`,
          index,
          // Unique per filter. The picker shows the filter instead of following the link.
          link: { path: `/examples/?package=${section.dir}`, label: section.label },
          img: section.img,
          active: section.dir === filter,
          section,
          isNew: section.isNew,
          isBeta: section.isBeta,
        }),
      );
    return { overview, items, counts };
  }, [examples, filter]);
};
