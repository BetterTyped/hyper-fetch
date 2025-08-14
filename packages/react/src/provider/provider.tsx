import React, { useContext, useMemo, useState } from "react";

import { ProviderProps, ProviderValueType } from "./provider.types";

const ConfigContext = React.createContext<ProviderValueType>({
  config: {},
  setConfig: () => null,
});

/**
 * Provider with configuration for hooks
 * @param options
 * @returns
 */
export const Provider = ({ children, config }: ProviderProps) => {
  const [currentConfig, setConfig] = useState(config || {});

  const value = useMemo(() => {
    const contextValue: ProviderValueType = { config: currentConfig, setConfig };
    return contextValue;
  }, [currentConfig]);

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
