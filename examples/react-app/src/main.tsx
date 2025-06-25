import { CssBaseline, Stack } from "@mui/material";
import * as ReactDOM from "react-dom/client";
import { SnackbarProvider } from "notistack";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { RouterProvider } from "react-router-dom";

import { router } from "./components/routing.constants";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <ThemeProvider theme={darkTheme}>
    <CssBaseline />
    <SnackbarProvider
      maxSnack={6}
      autoHideDuration={1000}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
    >
      <Stack direction="row">
        <RouterProvider router={router} />
      </Stack>
    </SnackbarProvider>
  </ThemeProvider>,
);
