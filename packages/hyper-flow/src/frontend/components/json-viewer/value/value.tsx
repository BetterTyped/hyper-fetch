import { useMemo } from "react";
import TextareaAutosize from "react-textarea-autosize";

import { jsonViewerStyles } from "../json-viewer.styles";
import { cn } from "@/lib/utils";

const dateKeys = ["date", "createdat", "updatedat", "created_at", "updated_at", "timestamp"];

/** ISO string of a value stored under a date-like key, or `null` when it isn't a valid date */
export const getDateValue = (key: string | number | undefined, raw: unknown): string | null => {
  if (typeof key !== "string" || !dateKeys.some((dateKey) => key.toLowerCase().includes(dateKey))) {
    return null;
  }
  if (typeof raw !== "string" && typeof raw !== "number") {
    return null;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

/** Turn the date input value back into the type the data had: a timestamp stays a number, a string an ISO string */
export const fromDateInput = (value: string, raw: unknown): string | number => {
  const parsed = new Date(`${value}Z`);
  if (Number.isNaN(parsed.getTime())) {
    return typeof raw === "number" ? raw : value;
  }
  return typeof raw === "number" ? parsed.getTime() : parsed.toISOString();
};

export const Value = ({
  value,
  raw,
  path,
  onChange,
  disabled = false,
}: {
  value: any;
  raw: any;
  path: (string | number)[];
  onChange: (value: any) => void;
  disabled?: boolean;
}) => {
  const disabledStyles = disabled ? "bg-transparent" : "bg-light-200 dark:bg-dark-400";
  // Key paths go from the leaf up, so the label reads them the other way round, e.g. "data.user.name"
  const label = [...path].toReversed().join(".");

  const date = useMemo(() => getDateValue(path[0], raw), [path, raw]);

  if (date) {
    return (
      <span className={cn(jsonViewerStyles.value, disabledStyles)} style={{ paddingLeft: !disabled ? "28px" : "8px" }}>
        <input
          disabled={disabled}
          className={cn(jsonViewerStyles.input, "w-fit")}
          type="datetime-local"
          step="1"
          aria-label={label}
          value={date.slice(0, 19)}
          onChange={(e) => onChange(fromDateInput(e.target.value, raw))}
        />
      </span>
    );
  }

  if (typeof raw === "boolean") {
    return (
      <span className={cn(jsonViewerStyles.value, disabledStyles)} style={{ paddingLeft: !disabled ? "28px" : "8px" }}>
        {!disabled && (
          <input
            disabled={disabled}
            className={cn(jsonViewerStyles.checkbox)}
            type="checkbox"
            aria-label={label}
            value={value}
            onChange={(e) => onChange(e.target.checked)}
            checked={raw}
          />
        )}
        {raw ? "true" : "false"}
      </span>
    );
  }

  if (typeof raw === "number") {
    return (
      <span className={cn(jsonViewerStyles.value, disabledStyles)}>
        <input
          disabled={disabled}
          className={cn(jsonViewerStyles.input)}
          type="number"
          aria-label={label}
          value={raw}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </span>
    );
  }

  if (typeof raw === "string") {
    // Multi-line text can be made taller by hand
    const resize = /\r|\n/.test(raw) ? "vertical" : "none";

    return (
      <span className={cn(jsonViewerStyles.value, disabledStyles)}>
        <TextareaAutosize
          maxRows={10}
          disabled={disabled}
          className={cn(jsonViewerStyles.input)}
          aria-label={label}
          value={raw}
          onChange={(e) => onChange(e.target.value)}
          style={{ resize }}
        />
      </span>
    );
  }

  return <span className={cn(jsonViewerStyles.value, "ml-2")}>{String(value)}</span>;
};
