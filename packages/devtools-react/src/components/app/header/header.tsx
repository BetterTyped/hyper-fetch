/* eslint-disable jsx-a11y/control-has-associated-label */
import { XIcon } from "lucide-react";

import { useDevtoolsContext, useDevtoolsWorkspaces } from "devtools.context";
import { DevtoolsModule } from "devtools.types";
import { tokens } from "theme/tokens";
import { createStyles } from "theme/use-styles.hook";
import { LogoIcon } from "icons/logo";
import { IconButton } from "components/icon-button/icon-button";

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
      color: ${isLight ? tokens.colors.dark[400] : tokens.colors.light[500]};
      font-size: 16px;
      font-weight: 500;
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
            ${isLight ? tokens.colors.light[100] : tokens.colors.dark[700]},
            ${isLight ? tokens.colors.light[100] : tokens.colors.dark[700]}
          )
          padding-box,
        conic-gradient(#94a3b8, #334155 25%, #334155 75%, #94a3b8 100%) border-box;
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
  const { activeWorkspace, workspaces } = useDevtoolsWorkspaces("DevtoolsWorkspace");

  const workspace = activeWorkspace ? workspaces[activeWorkspace] : null;
  const name = workspace?.name || "Devtools";

  return (
    <div {...props} className={css.base}>
      <button type="button" className={css.logo} onClick={() => setModule(DevtoolsModule.WORKSPACE)}>
        <LogoIcon />
      </button>
      <h3>{name}</h3>
      <div className={css.spacer} />
      <IconButton onClick={() => setOpen(false)}>
        <XIcon />
      </IconButton>
    </div>
  );
};
