import { useLayoutEffect, useRef } from "react";

import { useCountdown } from "@/hooks/use-countdown";

const getPlural = (value: number, singular: string) => `${value} ${singular}${value === 1 ? "" : "s"}`;

/**
 * Time left until `value` (a timestamp) in words, or `doneText` once it passed. Values that are no time, like
 * `Infinity`, show as they are.
 */
export const Countdown = ({
  value,
  doneText = "Past",
  onDone,
  onStart,
}: {
  value: number;
  doneText?: React.ReactNode;
  /** A running countdown reached its end, or its value moved to the past */
  onDone?: () => void;
  /** The countdown started counting toward a time in the future */
  onStart?: () => void;
}) => {
  const countdown = useCountdown(value);
  // `Infinity` never passes, `NaN` is no time at all
  const isDone = !(countdown.total > 0);
  const wasDone = useRef<boolean | null>(null);

  useLayoutEffect(() => {
    const previous = wasDone.current;
    wasDone.current = isDone;
    if (isDone === previous) {
      return;
    }
    if (!isDone) {
      onStart?.();
    } else if (previous === false) {
      onDone?.();
    }
  }, [isDone, onDone, onStart]);

  if (!Number.isFinite(value) || value < 1) {
    return String(value);
  }
  if (isDone) {
    return doneText;
  }

  return (
    <>
      {!!countdown.days && getPlural(countdown.days, "day")} {!!countdown.hours && getPlural(countdown.hours, "hour")}{" "}
      {!!countdown.minutes && getPlural(countdown.minutes, "minute")}{" "}
      {!!countdown.seconds && getPlural(countdown.seconds, "second")}
    </>
  );
};
