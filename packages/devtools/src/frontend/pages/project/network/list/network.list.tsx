/* eslint-disable react/no-array-index-key */
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { Request } from "./request/request";
import { Status } from "frontend/utils/request.status.utils";
import { PathsOf, useSearch } from "frontend/hooks/use-search";
import { DevtoolsRequestEvent } from "frontend/context/projects/types";
import { Table, TableBody, TableHeader, TableRow } from "frontend/components/ui/table";
import { TableSortable } from "frontend/components/ui/table-sortable";
import { useNetworkStore } from "frontend/store/project/network.store";
import { EmptyState } from "frontend/components/ui/empty-state";

export const NetworkList = () => {
  const { project } = useDevtools();
  const { requests, networkFilter, networkSearchTerm, networkSort } = useNetworkStore(
    useShallow((state) => state.projects[project.name]),
  );
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
      setNetworkSort({ project: project.name, sorting });
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
    <div className="w-full h-full flex-1">
      <Table className="w-full flex-1">
        <TableHeader style={{ opacity: !requests.length ? 0.4 : 1 }}>
          <TableRow>
            <TableSortable sort={handleGetSort("request.endpoint")} onSort={handleSort("request.endpoint")}>
              Endpoint
            </TableSortable>
            <TableSortable sort={handleGetSort("request.method")} onSort={handleSort("request.method")}>
              Method
            </TableSortable>
            <TableSortable sort={handleGetSort("response.success")} onSort={handleSort("response.success")}>
              Success
            </TableSortable>
            <TableSortable sort={handleGetSort("request.cache")} onSort={handleSort("request.cache")}>
              Cached
            </TableSortable>
            <TableSortable sort={handleGetSort("timestamp")} onSort={handleSort("timestamp")}>
              Timestamp
            </TableSortable>
          </TableRow>
        </TableHeader>
        <TableBody className="relative">
          {items?.map((item, index) => {
            return <Request key={index} item={item} />;
          })}
        </TableBody>
      </Table>
      {!items.length && <EmptyState title="No requests" description="Make some request to see them here!" />}
    </div>
  );
};
