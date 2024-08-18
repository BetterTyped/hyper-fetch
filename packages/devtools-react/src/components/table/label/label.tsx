import { ArrowDown } from "icons/arrow-down";
import { ArrowUp } from "icons/arrow-up";
import { createStyles } from "theme/use-styles.hook";
import { tokens } from "theme/tokens";

const styles = createStyles((isLight, css) => {
  return {
    label: css`
      font-weight: 400;
      font-size: 12px;
      text-align: left;
      padding: 6px 8px;
      color: ${tokens.colors.cyan[400]};
      border-radius: 8px;

      &[role="button"] {
        cursor: pointer;
      }

      &[role="button"]:hover {
        color: ${tokens.colors.cyan[500]};
        text-decoration: underline;
      }

      & svg {
        width: 10px;
        fill: ${isLight ? tokens.colors.light[600] : tokens.colors.light[200]};
        margin-left: 5px;
      }

      &[role="button"]:focus-within {
        outline-offset: -3px;
        outline: 2px solid ${tokens.colors.cyan[300]};
      }
    `,
    null: css`
      display: inline-flex;
      width: 10px;
      margin-left: 5px;
    `,
  };
});

export const Label = ({
  children,
  sort,
  onSort,
  className,
  ...props
}: React.DetailedHTMLProps<React.ThHTMLAttributes<HTMLTableCellElement>, HTMLTableCellElement> & {
  sort?: "asc" | "desc" | null;
  onSort?: (sort: "asc" | "desc" | null) => void;
}) => {
  const css = styles.useStyles();

  const handleSort = () => {
    if (sort === null) {
      return onSort?.("asc");
    }
    if (sort === "asc") {
      return onSort?.("desc");
    }
    return onSort?.(null);
  };

  if (onSort) {
    return (
      <th
        {...props}
        className={styles.clsx(css.label, className)}
        onClick={handleSort}
        tabIndex={0}
        role="button"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSort();
        }}
      >
        {children}
        {sort === "asc" && <ArrowUp />}
        {sort === "desc" && <ArrowDown />}
        {!sort && <span className={css.null} />}
      </th>
    );
  }
  return (
    <th {...props} className={styles.clsx(css.label, className)}>
      {children}
    </th>
  );
};
