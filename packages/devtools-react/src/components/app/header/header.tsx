/* eslint-disable jsx-a11y/control-has-associated-label */
import { CloudUploadIcon } from "lucide-react";

import { Button } from "components/button/button";
import { useDevtoolsContext } from "devtools.context";
import { DevtoolsModule } from "devtools.types";
import { FullLogoIcon } from "icons/full-logo";
import { tokens } from "theme/tokens";
import { createStyles } from "theme/use-styles.hook";

export const styles = createStyles(({ isLight, css }) => {
  return {
    base: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      border-bottom: 1px solid ${isLight ? tokens.colors.light[400] : tokens.colors.dark[400]};
      padding: 5px;
      height: 50px;
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
  };
});

export const Header = (props: React.HTMLProps<HTMLDivElement>) => {
  const css = styles.useStyles();

  const { setModule, theme } = useDevtoolsContext("DevtoolsHeader");

  return (
    <div {...props} className={css.base}>
      <button type="button" className={css.heading} onClick={() => setModule(DevtoolsModule.NETWORK)}>
        <FullLogoIcon height="26px" style={{ fill: theme === "light" ? tokens.colors.dark[200] : "#fff" }} />
      </button>
      <div className={css.spacer} />
      <Button color="pink">
        <CloudUploadIcon />
        Save Workspace
      </Button>
      <Button color="cyan">Login</Button>
    </div>
  );
};
