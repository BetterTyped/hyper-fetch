import Store, { Options } from "electron-store";
import { useState } from "react";
import { useEffect } from "react";

// track to not store in the same place
const names: string[] = [];

type StoreValue<T> = {
  version: string;
  value: T;
};

export const createStore = <T>(
  name: string,
  initialState: T,
  options?: Omit<Options<StoreValue<T>>, "name" | "defaults">,
) => {
  if (names.includes(name)) {
    throw new Error(`Store with name ${name} already exists`);
  }
  names.push(name);

  const store = new Store({
    ...options,
    defaults: {
      version: "0.0.1",
      value: initialState,
    },
  });

  const update: React.Dispatch<React.SetStateAction<T>> = (value) => {
    const newValue = typeof value === "function" ? (value as (prevState: T) => T)(store.get("value")!) : value;
    store.set({ value: newValue });
  };

  const useStore = () => {
    const [state, setState] = useState<T>(store.get("value"));

    useEffect(() => {
      const unsubscribe = store.onDidChange("value", (newValue) => {
        setState(newValue!);
      });

      return () => {
        unsubscribe();
      };
    }, []);

    return [state, update];
  };

  return { store, useStore };
};
