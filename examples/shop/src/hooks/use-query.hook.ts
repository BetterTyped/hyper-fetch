import queryString from "query-string";
import { NullableType, QueryParamsType } from "@hyper-fetch/core";
import { useLocation, useNavigate } from "react-router-dom";

const options: any = {
  arrayFormat: "bracket",
  skipEmptyString: true,
};

export interface UseQueryReturnType<T extends QueryParamsType> {
  search: string;
  query: T;
  setQueryParam: (param: keyof T, value: NullableType<T[typeof param]>) => void;
  setQueryParams: (value: T) => void;
  updateQueryParams: (values: Partial<T>) => void;
  stringify: (query: T) => string;
}

export const useQuery = <T extends QueryParamsType>(): UseQueryReturnType<T> => {
  const location = useLocation();
  const navigate = useNavigate();

  const query = queryString.parse(location.search, options) as T;

  function setQueryParams(value: T) {
    const stringifiedValue = queryString.stringify(value, options);

    navigate(`${location.pathname}${stringifiedValue ? "?" : ""}${stringifiedValue || ""}`, { replace: true });
  }

  function setQueryParam<D extends keyof T>(param: D, value: NullableType<T[D]>) {
    const newQuery: any = { ...query };

    newQuery[param] = value;

    const stringifiedValue = queryString.stringify(newQuery, options);

    navigate(`${location.pathname}${stringifiedValue ? "?" : ""}${stringifiedValue || ""}`, { replace: true });
  }

  function updateQueryParams(values: Partial<T>) {
    const newQuery = { ...query, ...values };

    const stringifiedValue = queryString.stringify(newQuery, options);
    navigate(`${location.pathname}${stringifiedValue ? "?" : ""}${stringifiedValue || ""}`, { replace: true });
  }

  function stringify(q: T | QueryParamsType): string {
    const str = queryString.stringify(q, options);
    const mark = str ? "?" : "";
    return mark + str;
  }

  return {
    query,
    search: location.search,
    setQueryParams,
    setQueryParam,
    updateQueryParams,
    stringify,
  };
};
