import { Stack } from "@mui/material";
import * as ReactDOM from "react-dom/client";
import { SnackbarProvider } from "notistack";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { DASHBOARD_PAGE, DETAILS_PAGE, FORM_PAGE, LIST_PAGE } from "./constants/routing.constants";
import DetailsPage from "./pages/details";
import ListPage from "./pages/list";
import FormPage from "./pages/form";
import DashboardPage from "./pages/index";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <SnackbarProvider
    maxSnack={6}
    autoHideDuration={1000}
    anchorOrigin={{
      vertical: "top",
      horizontal: "right",
    }}
  >
    <Stack direction="row">
      <BrowserRouter>
        <Routes>
          <Route path={DASHBOARD_PAGE.path} element={<DashboardPage />} />
          <Route path={DETAILS_PAGE.path} element={<DetailsPage />} />
          <Route path={LIST_PAGE.path} element={<ListPage />} />
          <Route path={FORM_PAGE.path} element={<FormPage />} />
        </Routes>
      </BrowserRouter>
    </Stack>
  </SnackbarProvider>,
);
