import { ThemeProvider } from "@mui/material/styles";
import React from "react";
import { createTheme } from "theme";

export type ProvidersProps = {
  children: React.ReactNode;
};

export const Providers = ({ children }: ProvidersProps) => {
  const theme = createTheme();

  return (
    <React.StrictMode>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </React.StrictMode>
  );
};
