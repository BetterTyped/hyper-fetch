import { createBrowserRouter, RouterProvider } from "react-router";

import { Layout } from "./components/Layout";
import { CartPage } from "./features/cart/CartPage";
import { CatalogPage } from "./features/catalog/CatalogPage";
import { CheckoutPage } from "./features/checkout/CheckoutPage";
import { ProductPage } from "./features/product/ProductPage";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: CatalogPage },
      { path: "products/:productId", Component: ProductPage },
      { path: "cart", Component: CartPage },
      { path: "checkout", Component: CheckoutPage },
    ],
  },
]);

export const App = () => <RouterProvider router={router} />;
