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
      <span className={css.value} style={{ paddingLeft: "18px" }}>
        <input
          disabled={disabled}
          className={css.checkbox}
          type="checkbox"
          value={value}
          onChange={(e) => onChange(e.target.checked)}
          checked={raw}
        />{" "}
        {raw ? "true" : "false"}
      </span>
    );
  }
  if (typeof raw === "number") {
    return (
      <span className={css.value}>
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
    return (
      <span className={css.value}>
        <input
          disabled={disabled}
          className={css.input}
          type="text"
          value={raw}
          onChange={(e) => onChange(e.target.value)}
        />
      </span>
    );
  }

  return <span>{String(value)}</span>;
};
