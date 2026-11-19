import type { PaginationConfig, RequestInstance } from "@hyper-fetch/core";
import type { HydrationContextType } from "hydrate/hydrate.types";

export type OperationKind = "initial" | "next" | "previous" | "refetch";

export type Operation = {
  kind: OperationKind;
  cancelled: boolean;
  promise: Promise<any>;
  resolve: (value: any) => void;
};

export type InfinitePage = {
  param: unknown;
  request: RequestInstance;
  storageKey: string;
  data: any;
  responseTimestamp: number;
};

export type FetchedPage = { param: unknown; request: RequestInstance; response: any };

export type InfiniteStoreOptions = {
  request: RequestInstance;
  pagination: PaginationConfig;
  maxPages?: number;
  structuralSharing?: boolean;
  hydration?: HydrationContextType | null;
};

export type InfiniteSnapshot = {
  items: unknown[];
  data: unknown[];
  pageParams: unknown[];
  total: number | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  loading: boolean;
  isFetching: boolean;
  isRefetching: boolean;
  isFetchingNextPage: boolean;
  isFetchingPreviousPage: boolean;
  isFetchNextPageError: boolean;
  isFetchPreviousPageError: boolean;
  error: any;
  status: any;
  extra: any;
  success: boolean;
};
