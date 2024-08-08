import { NoContentIcon } from "icons/no-content";
import { createStyles } from "theme/use-styles.hook";

const styles = createStyles((theme, css) => {
  return {
    base: css`
      display: flex;
      flex-direction: column;
      position: absolute;
      justify-content: center;
      align-items: center;
      color: #e2e2e2;
      flex: 1 1 auto;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
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
      <NoContentIcon width="40%" height="40%" style={{ opacity: "0.4" }} />
      <div className={css.text}>{text}</div>
    </div>
  );
};
