import { createBrowserRouter } from "react-router-dom";

import { DashboardPage } from "pages/dashboard/dashboard";
import { ProductsPage } from "pages/products/list";
import { ProductsDetailsPage } from "pages/products/details/products-details.page";
import { RootLayout } from "layouts/root/root.layout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <DashboardPage />,
      },
      {
        path: "products",
        element: <ProductsPage />,
      },
      {
        path: "products/:productId",
        element: <ProductsDetailsPage />,
      },
      {
        path: "*",
        element: <div>Not Found</div>,
      },
    ],
  },
]);
