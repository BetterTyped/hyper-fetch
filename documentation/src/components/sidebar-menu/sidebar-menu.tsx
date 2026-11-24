import { useLocation } from "@docusaurus/router";
import type { SidebarItem } from "@site/src/hooks/use-sidebar";
import { useSidebar } from "@site/src/hooks/use-sidebar";
import { apiGroupIndexOf, apiGroupOf } from "@site/src/api-groups";
import { groupIndexOf, groupOf } from "@site/src/integration-groups";
import { docsGroupLookup, guideGroupLookup } from "@site/src/section-groups";
import { BookOpen, LayoutGrid } from "lucide-react";

import { DocsVersionPicker } from "./docs-version-picker";
import { ExamplesMenu } from "./examples-menu";
import type { PopularSource } from "./popular-list";
import { POPULAR_INTEGRATIONS, POPULAR_PACKAGES, PopularList, usePopularEntries } from "./popular-list";
import type { SectionPickerProps } from "./section-picker";
import { SectionPicker } from "./section-picker";

type Area = Omit<SectionPickerProps, "items" | "activeItem"> & {
  /** Sections listed under the picker for quick access */
  popular: PopularSource;
};

/* Module level, so the pickers get stable functions */
const areas = {
  integrations: {
    noun: { one: "integration", many: "integrations" },
    groupOf: (item: SidebarItem) => groupOf(item.section),
    groupIndexOf: (item: SidebarItem) => groupIndexOf(item.section),
    overview: { label: "All integrations", icon: LayoutGrid },
    // Too many integrations to name a few, so the list suggests different ones on every visit
    popular: { random: "integrations", fallback: POPULAR_INTEGRATIONS },
  },
  api: {
    noun: { one: "package", many: "packages" },
    groupOf: (item: SidebarItem) => apiGroupOf(item.section),
    groupIndexOf: (item: SidebarItem) => apiGroupIndexOf(item.section),
    overview: { label: "API overview", icon: BookOpen },
    popular: { random: "api", fallback: POPULAR_PACKAGES },
  },
  guides: {
    noun: { one: "guide", many: "guides" },
    groupOf: (item: SidebarItem) => guideGroupLookup.groupOf(item.section),
    groupIndexOf: (item: SidebarItem) =>
      guideGroupLookup.groupIndexOf(item.section),
    overview: { label: "Getting started", icon: BookOpen },
    popular: { ids: POPULAR_PACKAGES },
  },
  docs: {
    noun: { one: "section", many: "sections" },
    groupOf: (item: SidebarItem) => docsGroupLookup.groupOf(item.section),
    groupIndexOf: (item: SidebarItem) =>
      docsGroupLookup.groupIndexOf(item.section),
    overview: { label: "Getting started", icon: BookOpen },
    popular: { ids: POPULAR_PACKAGES },
  },
} satisfies Record<string, Area>;

const areaOf = (pathname: string): Area => {
  if (pathname.includes("/integrations/")) return areas.integrations;
  if (pathname.includes("/api/")) return areas.api;
  if (pathname.includes("/guides/")) return areas.guides;
  return areas.docs;
};

export const SidebarMenu = () => {
  const { sidebar, activeItem } = useSidebar();
  // Every area picks its section from a command palette, the way the integrations do
  const { pathname } = useLocation();
  const { popular, ...area } = areaOf(pathname);
  const popularEntries = usePopularEntries(sidebar, popular);

  // The examples are not versioned and have no sections: their picker filters the list by package
  if (/^\/examples(\/|$)/.test(pathname)) {
    return <ExamplesMenu />;
  }

  return (
    <div className="px-4 min-w-[250px]">
      <div className="docs_sidebar flex flex-col gap-3">
        {/* The version decides which pages the picker below lists, so it comes first */}
        <DocsVersionPicker />
        {activeItem && (
          <SectionPicker items={sidebar} activeItem={activeItem} {...area} />
        )}
        {activeItem && <PopularList entries={popularEntries} />}
        {activeItem && (
          <hr className="h-px mt-1 mb-1 bg-gray-200 border-0 dark:bg-gray-700" />
        )}
      </div>
    </div>
  );
};
