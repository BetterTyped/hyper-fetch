import * as goober from "goober";

import { useDevtoolsContext } from "devtools.context";

export type StylesFactory<Keys extends string> = (
  theme: "light" | "dark",
  css: (typeof goober)["css"],
) => Record<Keys, ReturnType<(typeof goober)["css"]>>;

export const useStyles = <Keys extends string>(styles: StylesFactory<Keys>) => {
  const { css } = useDevtoolsContext("DevtoolsThemeContext");
  const theme = "light";

  if (theme === "light") {
    return styles("light", css);
  }
  return styles("dark", css);
};

export const createStyles = <Keys extends string>(styles: StylesFactory<Keys>) => {
  return {
    useStyles: () => useStyles(styles),
  };
};
