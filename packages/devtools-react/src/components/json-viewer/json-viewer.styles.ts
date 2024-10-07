import { tokens } from "theme/tokens";
import { createStyles } from "theme/use-styles.hook";

export const styles = createStyles(({ isLight, css }) => {
  return {
    base: css`
      padding: 0 10px;

      & * {
        font-size: 12px !important;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
      }
      & > ul {
        margin: 0 !important;
      }

      & ul {
        position: relative;
      }

      & label {
        min-height: 19px;
      }
      & ul > li {
        transform: translateX(-10px);
      }
      /* Expandable arrow down */
      & ul > li > div > div {
        color: ${isLight ? tokens.colors.light[400] : tokens.colors.dark[200]}!important;
      }
      & ul > li > div {
        margin-left: -6px;
      }
      /* Line under arrow */
      & ul > li > div::after {
        position: absolute;
        content: "";
        display: block;
        width: 2px;
        background: ${isLight ? tokens.colors.light[300] : tokens.colors.dark[500]};
        top: 25px;
        left: -3px;
        bottom: 5px;
      }

      & li:has(:nth-child(3)) > ul {
        display: grid !important;
        grid-template-columns: 1fr;
        width: calc(100% - 0.675em);
      }

      & li:not(:has(:nth-child(3))) {
        display: flex;
      }

      & li:not(:has(:nth-child(3))) > span {
        flex: 1 1 auto;
      }

      & * {
        box-sizing: border-box;
      }
    `,
    value: css`
      display: inline-flex;
      color: inherit;
      position: relative;
      background: ${isLight ? tokens.colors.light[200] : tokens.colors.dark[400]};
      padding: 2px 4px;
      border-radius: 4px;
      font-size: 12px;
      width: 100%;
      margin-left: 2px;
    `,
    disabledValue: css`
      background: transparent !important;
    `,
    input: css`
      color: inherit;
      background: transparent;
      border: 0;
      letter-spacing: 0.3px;
      resize: vertical;
      width: 100%;
      border-radius: 3px;

      &:focus {
        outline-offset: 2px;
        outline: 2px solid ${tokens.colors.cyan[400]};
      }
    `,
    checkbox: css`
      position: absolute;
      margin: 0;
      left: 4px;
      top: 50%;
      transform: translate(0, -50%);
      border-radius: 3px;

      &:focus {
        outline-offset: 2px;
        outline: 2px solid ${tokens.colors.cyan[400]};
      }
    `,
    label: css`
      position: relative;
      color: ${isLight ? tokens.colors.light[900] : tokens.colors.light[300]};
      white-space: nowrap;
    `,
    copy: css`
      position: relative;
      width: 12px;
      height: 12px;
      background: transparent;
      border: 0;
      padding: 0;
      margin-left: 4px;

      & svg {
        width: 12px;
        height: 12px;
        transform: translateY(2px);
      }
      & svg.copied {
        stroke: ${isLight ? tokens.colors.green[600] : tokens.colors.green[400]};
      }
    `,
  };
});
