/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable react/no-array-index-key */
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Boxes } from "lucide-react";

import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSearch } from "@/hooks/use-search";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { CacheRowItem } from "./row-item/row-item";
import { useCacheStore } from "@/store/applications/cache.store";
import { EmptyTable } from "@/components/no-content/empty-table";
import { Section, SectionHeader, SectionIcon, SectionTitle, SectionDescription } from "@/components/ui/section";
import { DocsButton } from "@/components/ui/docs-button";

export const CacheList = () => {
  const { application } = useDevtools();
  const caches = useCacheStore(useShallow((state) => state.applications[application.name]?.caches));
  const cacheSearchTerm = useCacheStore(useShallow((state) => state.applications[application.name]?.cacheSearchTerm));

  const data = useMemo(() => {
    return Array.from(caches.values()).filter((cache) => !!cache.cacheData);
  }, [caches]);

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
        <SectionDescription>This is the cache list for your application.</SectionDescription>
      </SectionHeader>
      {!!items.length && (
        <Table className="flex-1" wrapperClassName="pb-4">
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
              return <CacheRowItem key={index} item={item} />;
            })}
          </TableBody>
        </Table>
      )}
      {!items.length && (
        <EmptyTable title="No cache entries" description="Make some cached request to see its data here.">
          <DocsButton />
        </EmptyTable>
      )}
    </Section>
  );
};
