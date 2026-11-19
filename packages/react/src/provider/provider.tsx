import React, { useContext, useMemo, useRef, useState } from "react";
import { isEqual } from "utils";

import type { ProviderProps, ProviderValueType } from "./provider.types";

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

  // Follow the changes of the config prop - inline objects with the same values do not cause updates
  const previousConfig = useRef(config);
  if (!isEqual(previousConfig.current, config)) {
    previousConfig.current = config;
    setConfig(config || {});
  }

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
