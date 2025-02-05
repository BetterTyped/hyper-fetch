import { IconButton } from "frontend/components/icon-button/icon-button";
import { LogoIcon } from "frontend/icons/logo";
import { Background } from "./background";

import { styles } from "./devtools-toggle.styles";

export const DevtoolsToggle = (
  props: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>,
) => {
  const css = styles.useStyles();
  return (
    <IconButton type="button" {...props} className={css.button}>
      <Background />
      <div className={css.content}>
        <LogoIcon />
      </div>
    </IconButton>
  );
};
