import { tokens } from "theme/tokens";
import { createStyles } from "theme/use-styles.hook";

const styles = createStyles((isLight, css) => {
  return {
    separator: css`
      width: 1px;
      height: 100%;
      background: ${isLight ? tokens.colors.light[400] : tokens.colors.dark[400]};
    `,
  };
});

export const Separator = (props: React.HTMLProps<HTMLDivElement>) => {
  const { className } = props;
  const css = styles.useStyles();
  return <div {...props} className={styles.clsx(css.separator, className)} />;
};
