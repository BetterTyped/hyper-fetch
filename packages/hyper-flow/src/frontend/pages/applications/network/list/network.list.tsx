/* eslint-disable react/no-array-index-key */
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Earth } from "lucide-react";

import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { RequestRow } from "./request-row/request-row";
import { Status } from "@/utils/request.status.utils";
import { PathsOf, useSearch } from "@/hooks/use-search";
import { DevtoolsRequestEvent } from "@/context/applications/types";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSortable } from "@/components/ui/table-sortable";
import { useNetworkStore } from "@/store/applications/network.store";
import { cn } from "@/lib/utils";
import { Section, SectionDescription, SectionHeader, SectionIcon, SectionTitle } from "@/components/ui/section";
import { EmptyTable } from "@/components/no-content/empty-table";
import { DocsButton } from "@/components/ui/docs-button";

export const NetworkList = () => {
  const { application } = useDevtools();
  const requests = useNetworkStore(useShallow((state) => state.applications[application.name].requests));
  const networkFilter = useNetworkStore(useShallow((state) => state.applications[application.name].networkFilter));
  const networkSearchTerm = useNetworkStore(
    useShallow((state) => state.applications[application.name].networkSearchTerm),
  );
  const networkSort = useNetworkStore(useShallow((state) => state.applications[application.name].networkSort));
  const setNetworkSort = useNetworkStore((state) => state.setNetworkSort);

  const data = useMemo(() => {
    if (!networkFilter) return requests;
    switch (networkFilter) {
      case Status.SUCCESS:
        return requests.filter((item) => item.isSuccess);
      case Status.FAILED:
        return requests.filter((item) => item.isFinished && !item.isCanceled && !item.isSuccess);
      case Status.IN_PROGRESS:
        return requests.filter((item) => !item.isFinished);
      case Status.PAUSED:
        return requests.filter((item) => item.isPaused);
      case Status.CANCELED:
        return requests.filter((item) => item.isCanceled);
      default:
        return requests;
    }
  }, [requests, networkFilter]);

  const handleSort = (key: PathsOf<DevtoolsRequestEvent>) => {
    return (sort: "asc" | "desc" | null) => {
      const sorting = sort ? { key, order: sort } : null;
      setNetworkSort({ application: application.name, sorting });
    };
  };

  const handleGetSort = (key: PathsOf<DevtoolsRequestEvent>) => {
    if (!networkSort) return null;
    if (networkSort.key === key) return networkSort.order;
    return null;
  };

  const { items } = useSearch({
    data,
    searchKeys: ["request.endpoint", "request.method", "request.queryKey", "request.cacheKey", "request.abortKey"],
    searchTerm: networkSearchTerm,
    baseSort: networkSort
      ? (a, b) => {
          const { key, order } = networkSort;

          const path = key.split(".");

          const valueA = path.reduce((acc, k) => (acc as any)[k as any], a.item);
          const valueB = path.reduce((acc, k) => (acc as any)[k as any], b.item);

          if (valueA === valueB) return 0;
          if (order === "asc") return valueA > valueB ? 1 : -1;
          return valueA < valueB ? 1 : -1;
        }
      : undefined,
    dependencies: [networkSort],
  });

  return (
    <Section id="network" className="flex flex-col px-4 w-full h-full flex-1 overflow-auto">
      <SectionHeader sticky>
        <SectionIcon>
          <Earth />
        </SectionIcon>
        <SectionTitle>Network</SectionTitle>
        <SectionDescription>You can see here all the requests made from your application.</SectionDescription>
      </SectionHeader>
      {!!items.length && (
        <Table className="flex-1" wrapperClassName="pb-4">
          <TableHeader className={cn(!requests.length && "opacity-40", "sticky top-0 bg-sidebar z-10")}>
            <TableRow>
              <TableHead />
              <TableSortable sort={handleGetSort("request.endpoint")} onSort={handleSort("request.endpoint")}>
                Endpoint
              </TableSortable>
              <TableSortable sort={handleGetSort("request.cache")} onSort={handleSort("request.cache")}>
                Cache
              </TableSortable>
              <TableSortable sort={handleGetSort("timestamp")} onSort={handleSort("timestamp")}>
                Timestamp
              </TableSortable>
              <TableHead>Response time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="relative pb-8">
            {items?.map((item, index) => {
              return <RequestRow key={index} item={item} />;
            })}
          </TableBody>
        </Table>
      )}
      {!items.length && (
        <EmptyTable title="Network is empty" description="Make some request to see them listed here.">
          <DocsButton />
        </EmptyTable>
      )}
    </Section>
  );
};
