import { RootLayout } from "layouts/root/root.layout";
import { DashboardPage } from "pages/dashboard/dashboard";
import { ProductsDetailsPage } from "pages/products/details/products-details.page";
import { ProductsPage } from "pages/products/list";
import { createBrowserRouter } from "react-router-dom";

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
