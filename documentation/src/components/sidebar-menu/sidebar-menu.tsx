/* eslint-disable react/no-array-index-key */
import Link from "@docusaurus/Link";
import { useLocation } from "@docusaurus/router";
import type { SidebarItem } from "@site/src/hooks/use-sidebar";
import { useSidebar } from "@site/src/hooks/use-sidebar";
import { cn } from "@site/src/lib/utils";
import { apiGroupIndexOf, apiGroupOf } from "@site/src/api-groups";
import { groupIndexOf, groupOf } from "@site/src/integration-groups";
import { BookOpen, LayoutGrid } from "lucide-react";

import { DocsVersionPicker } from "./docs-version-picker";
import { SectionPicker } from "./section-picker";

const getColor = (item: SidebarItem) => {
  return item.active
    ? item.section
    : {
        text: `text-zinc-500 dark:text-zinc-400`,
        textHover: item.section.textHover,
        textAction: item.section.textAction,
        icon: `group-hover:shadow-zinc-200 dark:group-hover:bg-zinc-500 bg-zinc-400 dark:bg-zinc-500`,
        iconHover: item.section.iconHover,
        active: false,
      };
};

/* Module level, so the pickers get stable functions */
const integrationGroupOf = (item: SidebarItem) => groupOf(item.section);
const integrationGroupIndexOf = (item: SidebarItem) =>
  groupIndexOf(item.section);
const packageGroupOf = (item: SidebarItem) => apiGroupOf(item.section);
const packageGroupIndexOf = (item: SidebarItem) =>
  apiGroupIndexOf(item.section);

export const SidebarMenu = () => {
  const { sidebar, activeItem } = useSidebar();
  // Too many integrations and packages for a list, so their pages pick one from a command palette
  const { pathname } = useLocation();
  const isIntegrations = pathname.includes("/integrations/");
  const isApi = pathname.includes("/api/");
  const hasPicker = isIntegrations || isApi;

  return (
    <div className="px-4 min-w-[250px]">
      <div className="docs_sidebar flex flex-col gap-3">
        {activeItem && isIntegrations && (
          <SectionPicker
            items={sidebar}
            activeItem={activeItem}
            noun={{ one: "integration", many: "integrations" }}
            groupOf={integrationGroupOf}
            groupIndexOf={integrationGroupIndexOf}
            overview={{ label: "All integrations", icon: LayoutGrid }}
          />
        )}
        {activeItem && isApi && (
          <SectionPicker
            items={sidebar}
            activeItem={activeItem}
            noun={{ one: "package", many: "packages" }}
            groupOf={packageGroupOf}
            groupIndexOf={packageGroupIndexOf}
            overview={{ label: "API overview", icon: BookOpen }}
          />
        )}
        <DocsVersionPicker />
        {activeItem && hasPicker && (
          <hr className="h-px mt-1 mb-1 bg-gray-200 border-0 dark:bg-gray-700" />
        )}
        {activeItem && !hasPicker && (
          <div className="mt-4">
            <ul>
              {sidebar.map((item, index) => {
                const color = getColor(item);
                return (
                  <li key={index}>
                    <Link
                      to={item.link.path}
                      className={cn(
                        "group !no-underline flex items-center lg:text-sm lg:leading-6",
                        "mb-4 font-semibold capitalize",
                        color.text,
                        color.textAction,
                        color.textHover,
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center h-6 w-6 ",
                          "mr-4 rounded-md ring-1 ring-zinc-900/5 shadow-sm group-hover:shadow",
                          "group-hover:ring-zinc-900/10 dark:ring-0 dark:shadow-none",
                          "dark:group-hover:shadow-none dark:group-hover:highlight-white/10",
                          "dark:highlight-white/10",
                          color.icon,
                          color.iconHover,
                        )}
                      >
                        <item.img
                          className={`${item.active ? "brightness-110" : ""} group-hover:brightness-110  w-4 h-4`}
                        />
                      </div>
                      {item.name}
                      {item.isPro && (
                        <span className="ml-2 rounded-md bg-yellow-500 px-1.5 py-0.5 text-[11px] leading-none !text-black font-semibold no-underline group-hover:no-underline">
                          Pro
                        </span>
                      )}
                      {item.isNew && (
                        <span className="ml-2 rounded-md bg-lime-500 px-1.5 py-0.5 text-[11px] leading-none !text-black font-semibold no-underline group-hover:no-underline">
                          New
                        </span>
                      )}
                      {item.isBeta && (
                        <span className="ml-2 rounded-md bg-amber-400 px-1.5 py-0.5 text-[11px] leading-none !text-black font-semibold no-underline group-hover:no-underline">
                          Beta
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <hr className="h-px mt-6 mb-1 bg-gray-200 border-0 dark:bg-gray-700" />
          </div>
        )}
      </div>
    </div>
  );
};
