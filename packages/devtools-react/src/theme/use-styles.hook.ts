import clsx from "clsx";
import * as goober from "goober";

import { useDevtoolsContext } from "devtools.context";

export type StylesFactory<Keys extends string> = (
  isLight: boolean,
  css: (typeof goober)["css"],
) => Record<Keys, ReturnType<(typeof goober)["css"]>>;

export type ExtractKeys<T> = T extends {
  useStyles: () => { [key in infer Keys]: any };
}
  ? Keys
  : never;

export const useStyles = <Keys extends string>(styles: StylesFactory<Keys>) => {
  const { css, theme } = useDevtoolsContext("DevtoolsThemeContext");

  if (theme === "light") {
    return styles(true, css);
  }
  return styles(false, css);
};

export const createStyles = <Keys extends string>(styles: StylesFactory<Keys>) => {
  return {
    clsx,
    useStyles: () => useStyles(styles),
  };
};
