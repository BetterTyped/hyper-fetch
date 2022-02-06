import React from "react";
import { Route, Routes } from "react-router";
import { BrowserRouter } from "react-router-dom";
import Stack from "@mui/material/Stack";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";

import { DASHBOARD_PAGE, DETAILS_PAGE, FORM_PAGE, LIST_PAGE } from "constants/routing.constants";
import { Sidebar } from "components/sidebar";
import { theme } from "assets/theme";

import { DashboardPage } from "pages/dashboard/dashboard.page";
import { RestDetailsPage } from "pages/details/rest-details.page";
import { RestListPage } from "pages/list/rest-list.page";
import { RestFormPage } from "pages/form/rest-form.page";

export const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Stack direction="row">
          <Sidebar />
          <Routes>
            <Route path={DASHBOARD_PAGE.path} element={<DashboardPage />} />
            <Route path={DETAILS_PAGE.path} element={<RestDetailsPage />} />
            <Route path={LIST_PAGE.path} element={<RestListPage />} />
            <Route path={FORM_PAGE.path} element={<RestFormPage />} />
          </Routes>
        </Stack>
      </BrowserRouter>
    </ThemeProvider>
  );
};
