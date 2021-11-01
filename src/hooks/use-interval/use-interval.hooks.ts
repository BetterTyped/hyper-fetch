import { useRef } from "react";
import { useWillUnmount } from "@better-typed/react-lifecycle-hooks";

type Interval = {
  time: number;
  timer: ReturnType<typeof setInterval> | null;
};

type IntervalFn = (callback: () => void | Promise<void>) => void;

type UseIntervalReturnType = {
  interval: IntervalFn;
  resetInterval: VoidFunction;
  active: boolean;
};

export const useInterval = (delay = 600): UseIntervalReturnType => {
  const interval = useRef<Interval>({
    time: delay,
    timer: null,
  });
  interval.current.time = delay;

  const resetInterval = () => {
    if (interval.current.timer) clearInterval(interval.current.timer);
    interval.current.timer = null;
  };

  const createInterval: IntervalFn = (callback) => {
    resetInterval();

    interval.current.timer = setInterval(() => {
      callback();
    }, interval.current.time);
  };

  useWillUnmount(resetInterval);

  return { interval: createInterval, resetInterval, active: !!interval.current.timer };
};
