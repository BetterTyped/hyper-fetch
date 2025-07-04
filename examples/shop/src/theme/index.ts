import { createTheme as createMuiTheme } from "@mui/material";

import { createPalette } from "./create-palette";
import { createComponents } from "./create-components";
import { createShadows } from "./create-shadows";
import { createTypography } from "./create-typography";

export function createTheme() {
  const palette = createPalette();
  const components = createComponents({ palette });
  const shadows = createShadows();
  const typography = createTypography();

  return createMuiTheme({
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1440,
      },
    },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    components,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    palette,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    shadows,
    shape: {
      borderRadius: 8,
    },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    typography,
  });
}
