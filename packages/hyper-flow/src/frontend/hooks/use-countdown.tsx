import { useState } from "react";

import { useInterval } from "@/hooks/use-interval";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Time left until `endTime`: `total` in ms (negative once it passed), and the parts of what is left */
export const getTimeRemaining = (endTime: number) => {
  const total = endTime - Date.now();
  const left = Math.max(total, 0);

  return {
    total,
    days: Math.floor(left / DAY),
    hours: Math.floor(left / HOUR) % 24,
    minutes: Math.floor(left / MINUTE) % 60,
    seconds: Math.floor(left / SECOND) % 60,
  };
};

/** Time left until `time` (a timestamp), re-rendering every second */
export const useCountdown = (time: number) => {
  const [, setTick] = useState(0);

  useInterval(() => {
    setTick((tick) => tick + 1);
  }, SECOND);

  return getTimeRemaining(time);
};
