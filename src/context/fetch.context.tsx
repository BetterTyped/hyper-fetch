import React from "react";
import { initialFetchContextValues } from "./fetch.context.constants";
import { FetchProviderProps } from "./fetch.context.types";

export const FetchContext = React.createContext(initialFetchContextValues);

export const FetchProvider: React.FC<FetchProviderProps> = ({ client, children }) => {
  return <FetchContext.Provider value={client}>{children}</FetchContext.Provider>;
};
