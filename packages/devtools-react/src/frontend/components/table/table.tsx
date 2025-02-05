import { ArrowDown, ArrowUp } from "lucide-react";
import React from "react";

import { createStyles } from "frontend/theme/use-styles.hook";

const styles = createStyles(({ isLight, css, tokens }) => {
  return {
    wrapper: css`
      position: relative;
      overflow: auto;
    `,
    table: css`
      width: 100%;
      caption-side: bottom;
      font-size: 12px;
      border-spacing: 0;
    `,
    header: css`
      & tr th {
        border-bottom: 1px solid ${isLight ? tokens.colors.light[300] : tokens.colors.dark[400]};
      }
    `,
    body: css`
      & tr:last-child {
        border-bottom: 0;
      }

      & tr:nth-of-type(2n + 1) {
        background: rgba(0, 0, 0, 0.1);
      }
    `,
    footer: css`
      border-top: 1px solid ${isLight ? tokens.colors.light[300] : tokens.colors.dark[400]};
      background: ${isLight ? tokens.colors.light[50] : tokens.colors.dark[800]};
      font-weight: 500;
      & > tr:last-of-type {
        border-bottom: 0;
      }
    `,
    row: css`
      transition: all ease-in-out 0.2s;

      &:hover {
        background: ${isLight ? tokens.colors.light[200] : tokens.colors.dark[700]};
      }
      &[data-state="selected"] {
        background: ${isLight ? tokens.colors.light[200] : tokens.colors.dark[700]};
      }
    `,
    head: css`
      padding: 8px;
      font-weight: 500;
      text-align: left;
      color: ${isLight ? tokens.colors.dark[100] : tokens.colors.light[400]};
      &[role="checkbox"] {
        padding-right: 0;
      }
    `,
    cell: css`
      padding: 8px;
      vertical-align: middle;
      &[role="checkbox"] {
        padding-right: 0;
      }
    `,
    caption: css`
      margin-top: 8px;
      font-size: 12px;
      color: ${isLight ? tokens.colors.dark[100] : tokens.colors.light[400]};
    `,
    labelWrapper: css`
      display: flex;
      align-items: center;
    `,
    label: css`
      font-weight: 400;
      font-size: 12px;
      text-align: left;
      padding: 6px 8px;
      color: ${tokens.colors.cyan[400]};

      &[role="button"] {
        cursor: pointer;
      }

      &[role="button"]:hover {
        color: ${tokens.colors.cyan[500]};
        text-decoration: underline;
      }

      & svg {
        width: 10px;
        stroke: ${isLight ? tokens.colors.light[600] : tokens.colors.light[200]};
        margin-left: 5px;
      }

      &[role="button"]:focus-within {
        outline-offset: -3px;
        outline: 2px solid ${tokens.colors.cyan[300]};
      }
    `,
  };
});

export const Root = (props: React.HTMLProps<HTMLTableElement> & { wrapperClassName?: string }) => {
  const { className, wrapperClassName, ...rest } = props;
  const css = styles.useStyles();

  return (
    <div className={css.clsx(css.wrapper, wrapperClassName)}>
      <table {...rest} className={css.clsx(css.table, className)} />
    </div>
  );
};
Root.displayName = "Table";

export const Header = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => {
    const css = styles.useStyles();
    return <thead ref={ref} className={css.clsx(css.header, className)} {...props} />;
  },
);
Header.displayName = "TableHeader";

export const Body = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => {
    const css = styles.useStyles();
    return <tbody ref={ref} className={css.clsx(css.body, className)} {...props} />;
  },
);
Body.displayName = "TableBody";

export const Footer = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => {
    const css = styles.useStyles();
    return <tfoot ref={ref} className={css.clsx(css.footer, className)} {...props} />;
  },
);
Footer.displayName = "TableFooter";

export const Row = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => {
    const css = styles.useStyles();
    return <tr ref={ref} className={css.clsx(css.row, className)} {...props} />;
  },
);
Row.displayName = "TableRow";

export const Head = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => {
    const css = styles.useStyles();
    return <th ref={ref} className={css.clsx(css.head, className)} {...props} />;
  },
);
Head.displayName = "TableHead";

export const Cell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => {
    const css = styles.useStyles();
    return <td ref={ref} className={css.clsx(css.cell, className)} {...props} />;
  },
);
Cell.displayName = "TableCell";

export const Sortable = React.forwardRef<
  HTMLTableCellElement,
  React.HTMLAttributes<HTMLTableCellElement> & {
    sort?: "asc" | "desc" | null;
    onSort?: (sort: "asc" | "desc" | null) => void;
  }
>(({ className, sort, onSort, children, ...props }, ref) => {
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
      <Head
        {...props}
        className={css.clsx(css.label, className)}
        onClick={handleSort}
        tabIndex={0}
        role="button"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSort();
        }}
      >
        <div className={css.labelWrapper}>
          {children}
          {sort === "asc" && <ArrowUp width="12px" height="12px" />}
          {sort === "desc" && <ArrowDown width="12px" height="12px" />}
          {!sort && (
            <span
              style={{
                marginLeft: "5px",
                width: "10px",
                height: "12px",
              }}
            />
          )}
        </div>
      </Head>
    );
  }
  return <Head ref={ref} {...props} />;
});

export const Caption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => {
    const css = styles.useStyles();
    return <caption ref={ref} className={css.clsx(css.caption, className)} {...props} />;
  },
);
Caption.displayName = "TableCaption";
