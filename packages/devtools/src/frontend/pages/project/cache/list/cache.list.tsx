/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable react/no-array-index-key */
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Boxes } from "lucide-react";

import { Table, TableBody, TableHead, TableHeader, TableRow } from "frontend/components/ui/table";
import { useSearch } from "frontend/hooks/use-search";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { Item } from "./item/item";
import { useCacheStore } from "frontend/store/project/cache.store";
import { EmptyTable } from "frontend/components/ui/empty-table";
import { Section, SectionHeader, SectionIcon, SectionTitle, SectionDescription } from "frontend/components/ui/section";

export const CacheList = () => {
  const { project } = useDevtools();
  const caches = useCacheStore(useShallow((state) => state.projects[project.name]?.caches));
  const cacheSearchTerm = useCacheStore(useShallow((state) => state.projects[project.name]?.cacheSearchTerm));

  const data = useMemo(() => {
    return Array.from(caches.values()).filter((cache) => !!cache.cacheData);
  }, [caches.size]);

  const { items } = useSearch({
    data,
    searchKeys: ["cacheKey"],
    searchTerm: cacheSearchTerm,
  });

  return (
    <Section id="cache" className="flex flex-col px-4 w-full h-full flex-1 overflow-auto">
      <SectionHeader>
        <SectionIcon>
          <Boxes />
        </SectionIcon>
        <SectionTitle>Cache</SectionTitle>
        <SectionDescription>This is the cache list for your project.</SectionDescription>
      </SectionHeader>
      <div className="flex-1 max-h-full">
        {!!items.length && (
          <Table className="w-full h-full" wrapperClassName="pb-4">
            <TableHeader style={{ opacity: !caches.size ? 0.4 : 1 }}>
              <TableRow>
                <TableHead>Cache Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Observers</TableHead>
                <TableHead>Last updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="relative">
              {items.map((item, index) => {
                return <Item key={index} item={item} />;
              })}
            </TableBody>
          </Table>
        )}
        {!items.length && (
          <EmptyTable title="No cache entries" description="Make some cached request to see its data here." />
        )}
      </div>
    </Section>
  );
};
