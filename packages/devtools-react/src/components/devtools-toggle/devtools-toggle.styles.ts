import { tokens } from "theme/tokens";
import { createStyles } from "theme/use-styles.hook";

export const styles = createStyles((theme, css) => {
  return {
    button: css`
      display: flex;
      position: fixed;
      bottom: 20px;
      right: 20px;
      color: white;
      width: 50px;
      height: 50px;
      padding: 4px;
      box-shadow: ${tokens.shadow.sm(tokens.colors.yellow[500] + tokens.alpha[40])};
      border-radius: 100%;
      overflow: hidden;
      border: 1px solid ${`#ffa52f${tokens.alpha[60]}`};

      &:hover > svg:first-of-type {
        filter: brightness(1.1);
      }

      &:hover > div {
        background-color: ${tokens.colors.light[600]};
      }
      &:hover > div > svg:last-of-type {
        transform: scale(1.05);
        margin-bottom: 1px;
      }

      & > svg:first-of-type {
        width: 100% !important;
        height: 100% !important;
        border-radius: 100%;
        position: absolute;
        top: 0px;
        left: 0px;
      }
      & > div > svg:last-of-type {
        width: 24px !important;
        height: 24px !important;
        transition: 200ms ease-in-out;
      }
    `,
    content: css`
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      border-radius: 100%;
      background: ${tokens.colors.dark[200]};
    `,
  };
});
