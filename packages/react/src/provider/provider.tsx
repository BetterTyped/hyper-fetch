import React, { useContext, useLayoutEffect, useMemo, useState } from "react";
import { ClientInstance, hydrate } from "@hyper-fetch/core";

import { ProviderProps, ProviderValueType } from "./provider.types";

const ConfigContext = React.createContext<ProviderValueType>({
  config: {},
  setConfig: () => null,
});

/**
 * Context provider with configuration for hooks
 * @param options
 * @returns
 */
export const Provider = <Client extends ClientInstance>({
  children,
  client,
  config,
  hydrationData,
  hydrationConfig,
}: ProviderProps<Client>) => {
  const [currentConfig, setConfig] = useState(config || {});

  const value = useMemo(() => {
    const contextValue: ProviderValueType = { config: currentConfig, setConfig, hydrationData };
    return contextValue;
  }, [currentConfig, hydrationData]);

  // This updates the cache in client side rendering
  // For SSR we have to stick to using the initialData
  // This is because the cache is not available on the server
  // We don't want to override it for concurrent requests and users
  useLayoutEffect(() => {
    hydrate(client, hydrationData, hydrationConfig);
  }, [client, hydrationData, hydrationConfig]);

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};

/**
 * Hook to allow reading current context config
 * @returns
 */
export const useProvider = (): ProviderValueType => {
  const config = useContext(ConfigContext);
  return config;
};
