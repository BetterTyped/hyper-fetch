import { useLayoutEffect, useMemo, useRef } from "react";

import { useCountdown } from "hooks/use-countdown";

const getPlural = (value: number, singular: string) => {
  if (value === 1) return `${value} ${singular}`;
  return `${value} ${singular}s`;
};

export const Countdown = ({
  value,
  countInPast = false,
  doneText = "Past",
  onDone,
  onStart,
}: {
  value: number;
  countInPast?: boolean;
  doneText?: React.ReactNode;
  onDone?: () => void;
  onStart?: () => void;
}) => {
  const triggered = useRef(false);
  const number = useMemo(() => {
    if (value === Infinity) return -1;
    if (Number.isNaN(value)) return -1;
    if (value < 1) return -1;

    return value;
  }, [value]);

  const countdown = useCountdown(number);
  const prev = useRef(countdown);

  useLayoutEffect(() => {
    const hasChanged = JSON.stringify(prev.current) !== JSON.stringify(countdown);

    const now = Date.now();
    const shouldHandlePast = countInPast ? true : now < new Date(value).getTime();

    if (hasChanged && Object.values(countdown).every((v) => v < 1) && onDone) {
      triggered.current = false;
      onDone();
    } else if (shouldHandlePast && !triggered.current && onStart) {
      triggered.current = true;
      onStart();
    }
    prev.current = countdown;
  }, [countInPast, countdown, onDone, onStart, value]);

  useLayoutEffect(() => {
    triggered.current = false;
  }, [value]);

  if (number === -1) return String(value);
  if (Object.values(countdown).every((v) => !v)) return doneText;
  if (Object.values(countdown).some((v) => v < 0)) return doneText;

  return (
    <>
      {!!countdown.days && getPlural(countdown.days, "day")} {!!countdown.hours && getPlural(countdown.hours, "hour")}{" "}
      {!!countdown.minutes && getPlural(countdown.minutes, "minute")}{" "}
      {!!countdown.seconds && getPlural(countdown.seconds, "second")}
    </>
  );
};
