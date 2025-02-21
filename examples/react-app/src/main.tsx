import { CssBaseline, Stack } from "@mui/material";
import * as ReactDOM from "react-dom/client";
import { SnackbarProvider } from "notistack";
import { Devtools } from "@hyper-fetch/devtools";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import { routing } from "./constants/routing.constants";
import DashboardPage from "./pages/index";
import { client } from "./api";

const { Route } = routing;

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
        <Route to="Dashboard">
          <DashboardPage />
        </Route>
        <Route to="Details" />
        <Route to="List" />
        <Route to="Form" />
        <Route to="Websockets" />
      </Stack>
      <Devtools client={client} />
    </SnackbarProvider>
  </ThemeProvider>,
);
