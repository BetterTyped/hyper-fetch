import { NoContentIcon } from "icons/no-content";
import { tokens } from "theme/tokens";
import { createStyles } from "theme/use-styles.hook";

const styles = createStyles(({ isLight, css }) => {
  return {
    base: css`
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: ${isLight ? tokens.colors.dark[200] : tokens.colors.light[100]};
      width: 300px;
      margin: auto;
    `,
    text: css`
      font-size: 14px;
      font-weight: 300;
      text-align: center;
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
