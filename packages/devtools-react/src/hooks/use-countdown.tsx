import { useEffect, useRef, useState } from "react";

import { useInterval } from "hooks/use-interval";

export type UseCountdownOptions = {
  updateFrequency?: number;
};

export function getTimeRemaining(endTime: string | number, hasEnded: boolean) {
  const now = hasEnded ? new Date(endTime) : new Date();
  const end = hasEnded ? new Date() : new Date(endTime);

  let total = 0;

  if (now < end) {
    total = Date.parse(new Date(endTime) as unknown as string) - Date.parse(new Date() as unknown as string);
  }
  if (now > end) {
    total = Date.parse(new Date() as unknown as string) - Date.parse(new Date(endTime) as unknown as string);
  }

  const sign = now < end ? 1 : -1;

  const seconds = sign * Math.floor((total / 1000) % 60);
  const minutes = sign * Math.floor((total / 1000 / 60) % 60);
  const hours = sign * Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = sign * Math.floor(total / (1000 * 60 * 60 * 24));

  return {
    total: sign * total,
    days: hasEnded ? -days : days,
    hours: hasEnded ? -hours : hours,
    minutes: hasEnded ? -minutes : minutes,
    seconds: hasEnded ? -seconds : seconds,
  };
}

const initialState = {
  total: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

export const useCountdown = (endTime: Date | string | number, options?: UseCountdownOptions) => {
  const { updateFrequency = 1000 } = options || {};
  const time = endTime instanceof Date ? endTime.toISOString() : endTime;
  // Ref as we need only initial value
  const ended = useRef(new Date(time) < new Date());
  const hasEnded = ended.current;

  const [countdown, setCountdown] = useState(!hasEnded || hasEnded ? getTimeRemaining(time, hasEnded) : initialState);

  useInterval(() => {
    setCountdown(getTimeRemaining(time, hasEnded));
  }, updateFrequency);

  useEffect(() => {
    ended.current = new Date(time) < new Date();
  }, [time]);

  return countdown;
};
