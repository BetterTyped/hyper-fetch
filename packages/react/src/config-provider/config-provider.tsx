import React, { useContext, useMemo, useState } from "react";

import { ConfigProviderProps, ConfigProviderValueType } from "./config-provider.types";

const ConfigContext = React.createContext<ConfigProviderValueType>([{}, () => null]);

/**
 * Context provider with configuration for hooks
 * @param options
 * @returns
 */
export const ConfigProvider = ({ children, config }: ConfigProviderProps) => {
  const [currentConfig, setConfig] = useState(config || {});

  const value = useMemo(() => {
    const contextValue: ConfigProviderValueType = [currentConfig, setConfig];
    return contextValue;
  }, [currentConfig]);

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
