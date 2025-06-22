import { createBrowserRouter, Outlet } from "react-router-dom";

import DetailsPage from "../pages/details";
import ListPage from "../pages/list";
import FormPage from "../pages/form";
import { WebsocketsPage } from "../pages/websocket/websocket";
import DashboardPage from "../pages/index";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Outlet />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "details",
        element: <DetailsPage />,
      },
      {
        path: "list",
        element: <ListPage />,
      },
      {
        path: "forms",
        element: <FormPage />,
      },
      {
        path: "websockets",
        element: <WebsocketsPage />,
      },
    ],
  },
]);
