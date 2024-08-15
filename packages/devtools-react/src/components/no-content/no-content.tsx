import { NoContentIcon } from "icons/no-content";
import { createStyles } from "theme/use-styles.hook";

const styles = createStyles((theme, css) => {
  return {
    base: css`
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: #e2e2e2;
      width: 300px;
      margin: auto;
    `,
    text: css`
      font-size: 14px;
      font-weight: 300;
    `,
  };
});

export const NoContent = (props: React.HTMLProps<HTMLDivElement> & { text: string }) => {
  const { style, text, ...divProps } = props;
  const css = styles.useStyles();

  return (
    <div {...divProps} className={css.base}>
      <NoContentIcon width="50%" height="auto" style={{ opacity: "0.4" }} />
      <div className={css.text}>{text}</div>
    </div>
  );
};
