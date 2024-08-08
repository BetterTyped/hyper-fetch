import clsx from "clsx";
import * as goober from "goober";

import { useDevtoolsContext } from "devtools.context";

export type StylesFactory<Keys extends string> = (
  theme: "light" | "dark",
  css: (typeof goober)["css"],
) => Record<Keys, ReturnType<(typeof goober)["css"]>>;

export type ExtractKeys<T> = T extends {
  useStyles: () => { [key in infer Keys]: any };
}
  ? Keys
  : never;

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
    clsx,
    useStyles: () => useStyles(styles),
  };
};
