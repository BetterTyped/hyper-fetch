import * as React from "react";

export const createContext = <ContextValueType extends object | null>(
  name: string,
  initialValue?: ContextValueType,
) => {
  const providerName = `${name}Provider`;
  const Context = React.createContext<ContextValueType | undefined>(initialValue);

  const Provider = (props: ContextValueType & { children: React.ReactNode }) => {
    const { children, ...context } = props;
    // improve the memoization by using extracting values into separate props
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const value = React.useMemo(() => context, Object.values(context)) as ContextValueType;
    return <Context.Provider value={value}>{children}</Context.Provider>;
  };

  const useContext = (consumerName: string) => {
    const context = React.useContext(Context);
    if (context) return context;
    if (initialValue !== undefined) return initialValue;
    throw new Error(`${consumerName} must be used within a ${providerName}`);
  };

  Provider.displayName = providerName;
  return [Provider, useContext] as const;
};
