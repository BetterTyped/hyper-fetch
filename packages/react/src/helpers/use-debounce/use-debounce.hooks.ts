import { useRef } from "react";
import { useWillUnmount } from "@better-typed/react-lifecycle-hooks";

type Debounce = ReturnType<typeof setTimeout> | null;

type DebounceFunction = (callback: () => void | Promise<void>, time?: number) => void;

type UseDebounceReturnType = {
  debounce: DebounceFunction;
  resetDebounce: VoidFunction;
  active: boolean;
};

/**
 * @param delay
 * @internal
 * @returns
 */
export const useDebounce = (delay = 600): UseDebounceReturnType => {
  const debounce = useRef<Debounce>(null);

  const resetDebounce = () => {
    if (debounce.current !== null) clearTimeout(debounce.current);
    debounce.current = null;
  };

  const setDebounce: DebounceFunction = (callback, time) => {
    resetDebounce();
    debounce.current = setTimeout(() => {
      callback();
    }, time || delay);
  };

  useWillUnmount(resetDebounce);

  return { debounce: setDebounce, resetDebounce, active: !!debounce.current };
};
