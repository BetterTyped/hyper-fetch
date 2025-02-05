import * as React from "react";

import { createStyles, ExtractKeys } from "frontend/theme/use-styles.hook";

const styles = createStyles(({ isLight, css, tokens }) => {
  return {
    root: css`
      position: relative;
      width: 100%;
      border-radius: 0.5rem;
      padding: 1rem;
      border: 1px solid ${isLight ? tokens.colors.light[400] : tokens.colors.dark[400]};
    `,
    title: css`
      margin-bottom: 0.25rem;
      font-weight: 500;
      line-height: 1.25;
      letter-spacing: -0.025em;
    `,
    description: css`
      font-size: 0.875rem;
      line-height: 1.75;

      p {
        line-height: 1.75;
      }
    `,
  };
});

const variants = createStyles(({ isLight, css, tokens }) => {
  return {
    default: css`
      background: ${isLight ? tokens.colors.light[100] : tokens.colors.dark[700]};
      color: ${isLight ? tokens.colors.dark[400] : tokens.colors.light[400]};
    `,
    destructive: css`
      border-color: ${isLight ? tokens.colors.red[500] : tokens.colors.red[400]};
      color: ${isLight ? tokens.colors.red[500] : tokens.colors.red[400]};
    `,
  };
});

export const Root = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant: ExtractKeys<typeof variants> }
>(({ className, variant, ...props }, ref) => {
  const css = styles.useStyles();
  const cssVariants = variants.useStyles();
  return <div ref={ref} role="alert" className={css.clsx(css.root, cssVariants[variant], className)} {...props} />;
});
Root.displayName = "Alert";

export const Title = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    const css = styles.useStyles();
    return (
      <h5 ref={ref} className={css.clsx(css.title, className)} {...props}>
        {children}
      </h5>
    );
  },
);
Title.displayName = "AlertTitle";

export const Description = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const css = styles.useStyles();
    return <div ref={ref} className={css.clsx(css.description, className)} {...props} />;
  },
);
Description.displayName = "AlertDescription";
