import { LayoutGrid } from "lucide-react";
import type { SidebarItem } from "@site/src/hooks/use-sidebar";
import {
  filterGroupIndexOf,
  filterGroups,
  setExamplesFilter,
  useExampleFilterItems,
} from "@site/src/examples-filter";

import { hintOf, POPULAR_PACKAGES, PopularList } from "./popular-list";
import { SectionPicker } from "./section-picker";

/* Module level, so the picker gets stable functions */
const groupOf = (item: SidebarItem) => filterGroups[filterGroupIndexOf(item.section)];
const groupIndexOf = (item: SidebarItem) => filterGroupIndexOf(item.section);
const noun = { one: "package", many: "packages" };
const overview = { label: "All examples", icon: LayoutGrid };
const actionLabel = { open: "Show its examples", current: "Showing its examples" };

/**
 * The top of the examples sidebar: a picker that shows only the examples using one package or integration, and the
 * popular packages as one-click filters. Picking the current filter again shows every example.
 */
export const ExamplesMenu = () => {
  const { overview: allItem, items } = useExampleFilterItems();
  const activeItem = items.find((item) => item.active) ?? allItem;

  const select = (item: SidebarItem) =>
    setExamplesFilter(item === allItem || item.active ? null : item.section.dir);

  const popular = POPULAR_PACKAGES.flatMap((dir) => {
    const item = items.find((candidate) => candidate.section.dir === dir);
    if (!item) return [];
    return [
      {
        id: dir,
        name: item.name,
        img: item.img,
        color: item.section.text,
        hint: hintOf(item),
        current: item.active,
        onSelect: () => select(item),
      },
    ];
  });

  return (
    <div className="px-4 min-w-[250px]">
      <div className="docs_sidebar flex flex-col gap-3">
        <SectionPicker
          items={[allItem, ...items]}
          activeItem={activeItem}
          noun={noun}
          groupOf={groupOf}
          groupIndexOf={groupIndexOf}
          overview={overview}
          onSelect={select}
          actionLabel={actionLabel}
        />
        <PopularList entries={popular} />
        <hr className="h-px mt-1 mb-1 bg-gray-200 border-0 dark:bg-gray-700" />
      </div>
    </div>
  );
};
