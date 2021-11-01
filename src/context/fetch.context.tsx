import React from "react";
import { initialFetchContextValues } from "./fetch.context.constants";
import { FetchProviderProps } from "./fetch.context.types";

export const FetchContext = React.createContext(initialFetchContextValues);

/**
 * Provider used for access to queue/cache from different places in apps
 * Gives the context to the hooks like useQueue or useCache
 * This provider should not be required to use the library - it's only additional layer to access stored data.
 * @param children
 * @returns
 */
export const FetchProvider: React.FC<FetchProviderProps> = ({ children }) => {
  return <FetchContext.Provider value={{ currentDummyData: null }}>{children}</FetchContext.Provider>;
};
