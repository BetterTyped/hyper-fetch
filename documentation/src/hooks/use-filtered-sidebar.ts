import type { PropSidebarItem } from "@docusaurus/plugin-content-docs";
import { useLocation } from "@docusaurus/router";
import { useMemo } from "react";

import { keepsExampleLink, useFilteredExamplePaths } from "../examples-filter";

// Filter out pages from menu
const skipPages = ["props", "theming"];

export const getDocName = (item) => {
  if (item.label === "index") {
    const label = item.href.split("/");
    const name = label.reverse().find(Boolean);
    return {
      ...item,
      label: name,
    };
  }
  return item;
};

export const pickName = (categories) => {
  return categories.map((category) => {
    return {
      ...category,
      items: category.items?.map(getDocName),
    };
  });
};

const skipItems = (categories) => {
  return categories
    .filter((category) => {
      return !category.docId || !skipPages.some((page) => category.docId?.includes(page));
    })
    .map((category) => {
      const newItems = category.items ? skipItems(category.items) : [];
      const hasChildren = !!newItems.length;
      const collapsible = hasChildren ? category.collapsible : undefined;
      const collapsed = hasChildren ? category.collapsed : undefined;
      const type = hasChildren ? category.type : "link";

      return category.items ? { ...category, items: newItems, collapsible, collapsed, type } : category;
    });
};

/** Drops the example links the examples filter hides, and the categories it leaves empty */
const filterExamples = (items: PropSidebarItem[], paths: Set<string> | null): PropSidebarItem[] => {
  if (!paths) return items;
  return items.flatMap((item): PropSidebarItem[] => {
    if (item.type === "link") return keepsExampleLink(item.href, paths) ? [item] : [];
    if (item.type === "category") {
      const children = filterExamples(item.items ?? [], paths);
      return children.length ? [{ ...item, items: children, collapsed: false }] : [];
    }
    return [item];
  });
};

export const useFilteredSidebar = (items: PropSidebarItem[]) => {
  const examplePaths = useFilteredExamplePaths();
  const { pathname } = useLocation();
  // The page being read stays in the list, even when the filter would hide it
  const paths = useMemo(
    () => examplePaths && new Set([...examplePaths, pathname.replace(/\/$/, "")]),
    [examplePaths, pathname],
  );
  return pickName(skipItems(filterExamples(items, paths)));
};
