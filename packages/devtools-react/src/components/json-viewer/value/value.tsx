import { styles } from "../json-viewer.styles";

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
  const css = styles.useStyles();

  if (typeof raw === "boolean") {
    return (
      <span
        className={css.clsx(css.value, { [css.disabledValue]: disabled })}
        style={{ paddingLeft: !disabled ? "24px" : "" }}
      >
        {!disabled && (
          <input
            disabled={disabled}
            className={css.checkbox}
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
      <span className={css.clsx(css.value, { [css.disabledValue]: disabled })}>
        <input
          disabled={disabled}
          className={css.input}
          type="number"
          value={raw}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </span>
    );
  }
  if (typeof raw === "string") {
    const lines = Math.min(10, raw?.split(/\r\n|\r|\n/)?.length || 1);
    const maxHeight = `${lines * 18}px`;
    const resize = lines > 1 ? "vertical" : "none";

    return (
      <span className={css.clsx(css.value, { [css.disabledValue]: disabled })}>
        <textarea
          rows={lines}
          disabled={disabled}
          className={css.input}
          value={raw}
          onChange={(e) => onChange(e.target.value)}
          style={{ maxHeight, resize }}
        />
      </span>
    );
  }

  return <span>{String(value)}</span>;
};
