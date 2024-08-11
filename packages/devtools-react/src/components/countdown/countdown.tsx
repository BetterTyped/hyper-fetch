import { useLayoutEffect, useMemo, useRef } from "react";

import { useCountdown } from "hooks/use-countdown";

const getPlural = (value: number, singular: string) => {
  if (value === 1) return `${value} ${singular}`;
  return `${value} ${singular}s`;
};

export const Countdown = ({
  value,
  doneText = "Past",
  onDone,
  onStart,
}: {
  value: number;
  doneText?: React.ReactNode;
  onDone?: () => void;
  onStart?: () => void;
}) => {
  const triggered = useRef(true);
  const number = useMemo(() => {
    if (value === Infinity) return -1;
    if (Number.isNaN(value)) return -1;
    if (value < 1) return -1;

    return value;
  }, [value]);

  const countdown = useCountdown(number);

  useLayoutEffect(() => {
    if (Object.values(countdown).every((v) => v < 1) && onDone) {
      triggered.current = false;
      onDone();
    } else if (!triggered.current && onStart) {
      triggered.current = true;
      onStart();
    }
  }, [countdown, onDone, onStart]);

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
