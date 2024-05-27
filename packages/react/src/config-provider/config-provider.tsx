import React, { useContext, useLayoutEffect, useMemo, useState } from "react";
import { ClientInstance, hydrate } from "@hyper-fetch/core";

import { ConfigProviderProps, ConfigProviderValueType } from "./config-provider.types";

const ConfigContext = React.createContext<ConfigProviderValueType>({
  config: {},
  setConfig: () => null,
});

/**
 * Context provider with configuration for hooks
 * @param options
 * @returns
 */
export const ConfigProvider = <Client extends ClientInstance>({
  children,
  client,
  config,
  fallbacks,
  fallbacksConfig,
}: ConfigProviderProps<Client>) => {
  const [currentConfig, setConfig] = useState(config || {});

  const value = useMemo(() => {
    const contextValue: ConfigProviderValueType = { config: currentConfig, setConfig, fallbacks };
    return contextValue;
  }, [currentConfig, fallbacks]);

  // This updates the cache in client side rendering
  // For SSR we have to stick to using the initialData
  // This is because the cache is not available on the server
  // We don't want to override it for concurrent requests and users
  useLayoutEffect(() => {
    hydrate(client, fallbacks, fallbacksConfig);
  }, [client, fallbacks, fallbacksConfig]);

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};

/**
 * Hook to allow reading current context config
 * @returns
 */
export const useConfigProvider = (): ConfigProviderValueType => {
  const config = useContext(ConfigContext);
  return config;
};
