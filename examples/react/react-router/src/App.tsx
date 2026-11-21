import { createBrowserRouter, RouterProvider } from "react-router";

import { EditUser, editAction, Home, Root, RouteError, rootLoader, UserPage, userLoader } from "./routes";

const router = createBrowserRouter([
  {
    path: "/",
    loader: rootLoader,
    Component: Root,
    children: [
      { index: true, Component: Home },
      {
        path: "users/:userId",
        loader: userLoader,
        errorElement: <RouteError />,
        children: [
          { index: true, Component: UserPage },
          { path: "edit", Component: EditUser, action: editAction },
        ],
      },
    ],
  },
]);

export const App = () => <RouterProvider router={router} />;
