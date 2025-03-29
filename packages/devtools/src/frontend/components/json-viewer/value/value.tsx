import TextareaAutosize from "react-textarea-autosize";

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
  if (typeof raw === "boolean") {
    return (
      <span
        className={`inline-flex relative ${disabled ? "bg-transparent" : "bg-light-200 dark:bg-dark-400"} rounded px-1 py-0.5`}
        style={{ paddingLeft: !disabled ? "28px" : "8px" }}
      >
        {!disabled && (
          <input
            disabled={disabled}
            className="absolute left-1 top-1/2 -translate-y-1/2 rounded focus:outline-2 focus:outline-cyan-400"
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
      <span
        className={`inline-flex ${disabled ? "bg-transparent" : "bg-light-200 dark:bg-dark-400"} rounded px-1 py-0.5`}
      >
        <input
          disabled={disabled}
          className="w-full bg-transparent border-0 tracking-wider rounded focus:outline-2 focus:outline-cyan-400"
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
      <span
        className={`inline-flex ${disabled ? "bg-transparent" : "bg-light-200 dark:bg-dark-400"} rounded px-1 py-0.5`}
      >
        <TextareaAutosize
          maxRows={10}
          disabled={disabled}
          className="w-full bg-transparent border-0 tracking-wider rounded focus:outline-2 focus:outline-cyan-400"
          value={raw}
          onChange={(e) => onChange(e.target.value)}
          style={{ resize }}
        />
      </span>
    );
  }

  return <span>{String(value)}</span>;
};
