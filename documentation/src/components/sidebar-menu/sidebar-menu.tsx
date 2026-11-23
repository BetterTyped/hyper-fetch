import { useLocation } from "@docusaurus/router";
import type { SidebarItem } from "@site/src/hooks/use-sidebar";
import { useSidebar } from "@site/src/hooks/use-sidebar";
import { apiGroupIndexOf, apiGroupOf } from "@site/src/api-groups";
import { groupIndexOf, groupOf } from "@site/src/integration-groups";
import { docsGroupLookup, guideGroupLookup } from "@site/src/section-groups";
import { BookOpen, LayoutGrid } from "lucide-react";

import { DocsVersionPicker } from "./docs-version-picker";
import type { SectionPickerProps } from "./section-picker";
import { SectionPicker } from "./section-picker";

type Area = Omit<SectionPickerProps, "items" | "activeItem">;

/* Module level, so the pickers get stable functions */
const areas = {
  integrations: {
    noun: { one: "integration", many: "integrations" },
    groupOf: (item: SidebarItem) => groupOf(item.section),
    groupIndexOf: (item: SidebarItem) => groupIndexOf(item.section),
    overview: { label: "All integrations", icon: LayoutGrid },
  },
  api: {
    noun: { one: "package", many: "packages" },
    groupOf: (item: SidebarItem) => apiGroupOf(item.section),
    groupIndexOf: (item: SidebarItem) => apiGroupIndexOf(item.section),
    overview: { label: "API overview", icon: BookOpen },
  },
  guides: {
    noun: { one: "guide", many: "guides" },
    groupOf: (item: SidebarItem) => guideGroupLookup.groupOf(item.section),
    groupIndexOf: (item: SidebarItem) =>
      guideGroupLookup.groupIndexOf(item.section),
    overview: { label: "Getting started", icon: BookOpen },
  },
  docs: {
    noun: { one: "section", many: "sections" },
    groupOf: (item: SidebarItem) => docsGroupLookup.groupOf(item.section),
    groupIndexOf: (item: SidebarItem) =>
      docsGroupLookup.groupIndexOf(item.section),
    overview: { label: "Getting started", icon: BookOpen },
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
  const area = areaOf(pathname);

  return (
    <div className="px-4 min-w-[250px]">
      <div className="docs_sidebar flex flex-col gap-3">
        {activeItem && (
          <SectionPicker items={sidebar} activeItem={activeItem} {...area} />
        )}
        <DocsVersionPicker />
        {activeItem && (
          <hr className="h-px mt-1 mb-1 bg-gray-200 border-0 dark:bg-gray-700" />
        )}
      </div>
    </div>
  );
};
