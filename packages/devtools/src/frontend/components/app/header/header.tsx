/* eslint-disable jsx-a11y/control-has-associated-label */
import { XIcon } from "lucide-react";

import { useDevtoolsContext, useOnlineProjects } from "frontend/pages/workspace/_context/devtools.context";
import { DevtoolsModule } from "frontend/pages/workspace/_context/devtools.types";
import { tokens } from "frontend/theme/tokens";
import { createStyles } from "frontend/theme/use-styles.hook";
import { LogoIcon } from "frontend/icons/logo";
import { IconButton } from "frontend/components/icon-button/icon-button";

export const styles = createStyles(({ isLight, css }) => {
  return {
    base: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      border-bottom: 1px solid ${isLight ? tokens.colors.light[400] : tokens.colors.dark[400]};
      padding: 5px 10px;
      height: 42px;
    `,
    heading: css`
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 10px 0 4px;
      margin-bottom: -4px;
      border-radius: 6px;
      gap: 8px;
      background: transparent;
      border: 0;
      outline-offset: -4px !important;
    `,

    title: css`
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -webkit-text-size-adjust: 100%;
      font-feature-settings: normal;
      font-variation-settings: normal;
      tab-size: 4;
      -webkit-tap-highlight-color: transparent;
      background-image: linear-gradient(
        to bottom,
        ${isLight ? "#1e293b99" : "#e2e8f099"},
        ${isLight ? "#1e293b" : "#e2e8f0"},
        ${isLight ? "#1e293b99" : "#e2e8f099"}
      );
      background-clip: text;
      font-weight: 800;
      color: #0000 !important;
      line-height: 1;
      font-size: 1.3rem;
      margin: 0;
    `,
    spacer: css`
      flex: 1 1 auto;
    `,
    logo: css`
      display: flex;
      justify-content: center;
      align-items: center;
      background:
        linear-gradient(
            ${isLight ? tokens.colors.light[50] : tokens.colors.dark[700]},
            ${isLight ? tokens.colors.light[100] : tokens.colors.dark[700]}
          )
          padding-box,
        conic-gradient(
            ${isLight ? "#94a3b8" : "#94a3b8"},
            ${isLight ? "#c4d5ed" : "#334155"} 25%,
            ${isLight ? "#c4d5ed" : "#334155"} 75%,
            ${isLight ? "#94a3b8" : "#94a3b8"} 100%
          )
          border-box;
      border-radius: 8px;
      border: 1px solid #0000 !important;
      width: 32px;
      height: 32px;

      & svg {
        width: 18px !important;
        height: 18px !important;
      }
    `,
  };
});

export const Header = (props: React.HTMLProps<HTMLDivElement>) => {
  const css = styles.useStyles();

  const { setOpen, setModule } = useDevtoolsContext("DevtoolsHeader");
  const { activeWorkspace, workspaces } = useOnlineProjects("DevtoolsWorkspace");

  const workspace = activeWorkspace ? workspaces[activeWorkspace] : null;
  const name = workspace?.name || "Devtools";

  return (
    <div {...props} className={css.base}>
      <button type="button" className={css.logo} onClick={() => setModule(DevtoolsModule.NETWORK)}>
        <LogoIcon />
      </button>
      <h3 className={css.title}>{name}</h3>
      <div className={css.spacer} />
      <IconButton onClick={() => setOpen(false)}>
        <XIcon />
      </IconButton>
    </div>
  );
};
