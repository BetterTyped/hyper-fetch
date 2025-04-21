import TextareaAutosize from "react-textarea-autosize";

import { cn } from "frontend/lib/utils";

import { jsonViewerStyles } from "../json-viewer.styles";

export const Value = ({
  value,
  raw,
  onChange,
  disabled = false,
}: {
  value: any;
  raw: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}) => {
  const disabledStyles = disabled ? "bg-transparent" : "bg-light-200 dark:bg-dark-400";

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
