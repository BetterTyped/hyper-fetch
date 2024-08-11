import { useEffect, useRef, useState } from "react";

export type UseIntervalOptions = {
  immediate?: boolean;
  disabled?: boolean;
};

export const useInterval = (callback: () => void, interval: number | null, options?: UseIntervalOptions) => {
  const { immediate = true, disabled = false } = options || {};

  const [id, setId] = useState<null | ReturnType<typeof setInterval>>(null);
  const savedCallback = useRef(callback);

  const stop = () => {
    if (id) clearInterval(id);
    setId(null);
  };

  const start = () => {
    stop();
    if ((!interval && interval !== 0) || disabled) {
      return;
    }
    setId(setInterval(() => savedCallback.current(), interval));
  };

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    savedCallback.current = callback;
    if (immediate) {
      start();
      return stop;
    }
  }, []);

  useEffect(() => {
    savedCallback.current = callback;
    start();
    return stop;
  }, [interval]);

  return { active: id !== null, start, stop };
};
