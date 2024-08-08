import * as goober from "goober";

import { useDevtoolsContext } from "devtools.context";

export type StylesFactory = (
  theme: "light" | "dark",
  css: (typeof goober)["css"],
) => Record<string, ReturnType<(typeof goober)["css"]>>;

export const useStyles = <T extends StylesFactory>(styles: T) => {
  const { css } = useDevtoolsContext("DevtoolsThemeContext");
  const theme = "light";

  if (theme === "light") {
    return styles("light", css);
  }
  return styles("dark", css);
};
