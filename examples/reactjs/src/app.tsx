import React from "react";
import { Route, Routes } from "react-router";
import { BrowserRouter } from "react-router-dom";

import { DashboardPage } from "pages/dashboard/dashboard.page";
import { RestDetailsPage } from "pages/details/rest-details.page";
import { RestListPage } from "pages/list/rest-list.page";
import { RestFormPage } from "pages/form/rest-form.page";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/rest/details" element={<RestDetailsPage />} />
        <Route path="/rest/list" element={<RestListPage />} />
        <Route path="/rest/form" element={<RestFormPage />} />
      </Routes>
    </BrowserRouter>
  );
};
