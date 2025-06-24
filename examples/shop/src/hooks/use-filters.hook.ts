import { useState } from "react";
import { NullableType, QueryParamType, QueryParamsType } from "@hyper-fetch/core";
import { useDebounce } from "@better-hooks/performance";

import { useQuery } from "./use-query.hook";

type KeyOf<T> = keyof T;

type GetActiveValueCallback<T> = (name: KeyOf<T>, value: QueryParamType) => boolean;
type GetValueCallback<T> = (name: KeyOf<T>) => NullableType<T[KeyOf<T>]>;
type SetValueCallback<T> = (name: KeyOf<T>) => (value: T[KeyOf<T>]) => void;

export type UseFiltersReturnType<T extends QueryParamsType> = {
  queryString: string;
  query: T;
  state: T;
  handleApplyFilters: VoidFunction;
  handleClearFilters: VoidFunction;
  handleResetFilters: VoidFunction;
  getValue: GetValueCallback<T>;
  setValue: SetValueCallback<T>;
  getActiveValue: GetActiveValueCallback<T>;
  getActiveValues: GetActiveValueCallback<T>;
  setValues: SetValueCallback<T>;
  searchValue: string;
  setSearch: (value: string) => void;
  setQueryParams: (value: T) => void;
  updateQueryParams: (values: Partial<T>) => void;
};

export type UseFiltersProps<T extends QueryParamsType> = {
  searchKey?: string;
  nonClearableKeys?: string[];
  searchDebounce?: number;
  initialState?: T;
  isStateBased?: boolean;
  applyTrigger?: boolean;
};

export const paginationKeys = ["offset", "limit", "page"];

export const useFilters = <T extends QueryParamsType>({
  searchKey = "search",
  nonClearableKeys = [],
  searchDebounce = 500,
  initialState,
  isStateBased = false,
  applyTrigger = false,
}: UseFiltersProps<T> = {}): UseFiltersReturnType<T> => {
  const { debounce } = useDebounce({ delay: searchDebounce });

  const { query, stringify, setQueryParam, setQueryParams, updateQueryParams } = useQuery<T>();
  const [state, setState] = useState<T>(initialState || (query as any));

  const getCurrentState = (): T => {
    if (isStateBased) return state;
    return { ...initialState, ...query };
  };

  const currentState: T = getCurrentState();

  const handleApplyFilters = () => {
    const newQuery = { ...query, ...state };
    setState(newQuery);
    if (!isStateBased) setQueryParams(newQuery);
  };

  const handleResetFilters = () => {
    const exceptionKey = [...paginationKeys, ...nonClearableKeys];

    const newQuery = Object.entries(currentState).reduce<any>((acc, [key, value]) => {
      if (exceptionKey.includes(key)) {
        acc[key] = value;
      } else if (initialState?.[key]) {
        acc[key] = initialState?.[key];
      }
      return acc;
    }, {});

    setState(newQuery);

    if (!isStateBased) setQueryParams(newQuery);
  };

  const handleClearFilters = () => {
    const exceptionKey = [...paginationKeys, ...nonClearableKeys];

    const newQuery = Object.entries(currentState).reduce<any>((acc, [key, value]) => {
      if (exceptionKey.includes(key)) acc[key] = value;
      return acc;
    }, {});

    setState(newQuery);

    if (!isStateBased) setQueryParams(newQuery);
  };

  const getInitialSearchValue = (): string => {
    const value: any = currentState[searchKey];
    return typeof value === "string" ? value : "";
  };

  const [searchValue, setSearchValue] = useState(getInitialSearchValue());

  const setSearch = (value: string) => {
    setSearchValue(value);

    if (searchKey) {
      debounce(() => {
        setQueryParam(searchKey as keyof T, value as any);
      });
    }
  };

  const setParam = <D extends keyof T>(key: D, value: NullableType<T[D]>) => {
    if (isStateBased || applyTrigger) return setState((prev: any) => ({ ...prev, [key]: value }));
    setQueryParam(key, value);
  };

  const getActiveValue: GetActiveValueCallback<T> = (key, value) => currentState[key] === value;

  const getActiveValues: GetActiveValueCallback<T> = (key, value) => (currentState[key] as any)?.includes(value);

  const setValues: SetValueCallback<T> = (key) => (value) => {
    let currValue: any = Array.isArray(currentState[key]) ? currentState[key] : [];

    if (currValue?.includes(value)) {
      currValue = currValue.filter((val: any) => val !== value);
    } else {
      currValue.push(value);
    }

    setParam(key, currValue);
  };

  const getValue: GetValueCallback<T> = (key) => currentState[key];

  const setValue: SetValueCallback<T> = (key) => (value) => setParam(key, value);

  return {
    queryString: stringify(currentState),
    query,
    state,
    getValue,
    setValue,
    getActiveValue,
    getActiveValues,
    setValues,
    handleApplyFilters,
    handleResetFilters,
    handleClearFilters,
    searchValue,
    setSearch,
    setQueryParams,
    updateQueryParams,
  };
};
