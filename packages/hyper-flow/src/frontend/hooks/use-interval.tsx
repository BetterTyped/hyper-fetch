import { useEffect, useLayoutEffect, useRef } from "react";

/** Calls the latest `callback` every `interval` ms while mounted, and restarts when the interval changes. */
export const useInterval = (callback: () => void, interval: number) => {
  const savedCallback = useRef(callback);

  useLayoutEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const id = setInterval(() => savedCallback.current(), interval);
    return () => clearInterval(id);
  }, [interval]);
};
