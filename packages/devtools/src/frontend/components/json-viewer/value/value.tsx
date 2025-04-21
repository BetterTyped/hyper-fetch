import { useMemo } from "react";
import TextareaAutosize from "react-textarea-autosize";

import { cn } from "frontend/lib/utils";

import { jsonViewerStyles } from "../json-viewer.styles";

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

  const isDate = useMemo(() => {
    const last = path[path.length - 1];
    // TODO - just do the proper lookup for the date value, do not check for the keys
    if (typeof last === "string") {
      const keys = ["date", "createdAt", "updatedAt", "created_at", "updated_at", "timestamp"];
      return keys.some((key) => last.toLowerCase().includes(key));
    }
    return false;
  }, [path]);

  const date = useMemo(() => {
    if (!isDate || !raw) return undefined;
    const parsed = new Date(raw);
    return parsed.toISOString();
  }, [isDate, raw]);

  if (isDate) {
    return (
      <span className={cn(jsonViewerStyles.value, disabledStyles)} style={{ paddingLeft: !disabled ? "28px" : "8px" }}>
        {!disabled && (
          <input
            disabled={disabled}
            className={cn(jsonViewerStyles.checkbox)}
            type="date"
            value={date}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
        {date || "null"}
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
          value={raw}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </span>
    );
  }

  if (typeof raw === "string") {
    const lines = Math.min(10, raw?.split(/\r\n|\r|\n/)?.length || 1);
    const resize = lines > 1 ? "vertical" : "none";

    return (
      <span className={cn(jsonViewerStyles.value, disabledStyles)}>
        <TextareaAutosize
          maxRows={10}
          disabled={disabled}
          className={cn(jsonViewerStyles.input)}
          value={raw}
          onChange={(e) => onChange(e.target.value)}
          style={{ resize }}
        />
      </span>
    );
  }

  return <span className={cn(jsonViewerStyles.value, "ml-2")}>{String(value)}</span>;
};
