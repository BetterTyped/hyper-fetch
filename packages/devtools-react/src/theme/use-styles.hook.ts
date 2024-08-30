import clsx from "clsx";
import * as goober from "goober";

import { tokens } from "./tokens";
import { useDevtoolsContext } from "devtools.context";

export type StylesFactory<Keys extends string> = (params: {
  isLight: boolean;
  css: (typeof goober)["css"];
  tokens: typeof tokens;
}) => Record<Keys, ReturnType<(typeof goober)["css"]>>;

export type ExtractKeys<T> = T extends {
  useStyles: () => { [key in infer Keys]: any };
}
  ? Keys
  : never;

export const useStyles = <Keys extends string>(styles: StylesFactory<Keys>) => {
  const { css, theme } = useDevtoolsContext("DevtoolsThemeContext");

  const isLight = theme === "light";

  return { ...styles({ isLight, css, tokens }), clsx };
};

export const createStyles = <Keys extends string>(styles: StylesFactory<Keys>) => {
  return {
    clsx,
    useStyles: () => useStyles(styles),
  };
};
