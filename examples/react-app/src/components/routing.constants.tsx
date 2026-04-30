import { createBrowserRouter, Outlet } from "react-router-dom";

import DetailsPage from "../pages/details";
import FormPage from "../pages/form";
import DashboardPage from "../pages/index";
import ListPage from "../pages/list";
import { WebsocketsPage } from "../pages/websocket/websocket";

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
