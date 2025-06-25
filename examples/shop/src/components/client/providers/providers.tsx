import React from "react";
import { ThemeProvider } from "@mui/material/styles";

import { createTheme } from "theme";

export type ProvidersProps = {
  children: React.ReactNode;
};

export const Providers: React.FC<ProvidersProps> = ({ children }: ProvidersProps) => {
  const theme = createTheme();

  return (
    <React.StrictMode>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </React.StrictMode>
  );
};
