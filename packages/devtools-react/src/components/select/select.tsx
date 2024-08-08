import { createStyles } from "theme/use-styles.hook";

const styles = createStyles((theme, css) => {
  return {
    base: css`
      padding: 12px 14px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 4px;
      background: transparent;
      color: rgb(180, 194, 204);
      height: 22px;
      border: 1px solid rgb(77, 78, 79);
    `,
  };
});

export const Select = (props: React.HTMLProps<HTMLSelectElement> & { options: { value: string; label: string }[] }) => {
  const { options, style, className, ...selectProps } = props;
  const css = styles.useStyles();

  return (
    <select {...selectProps} className={styles.clsx(css.base, className)}>
      {options.map((option) => (
        <option key={option.value}>{option.label}</option>
      ))}
    </select>
  );
};
