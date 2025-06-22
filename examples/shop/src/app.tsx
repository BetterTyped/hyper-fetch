import { CssBaseline } from "@mui/material";
import { useListener } from "@hyper-fetch/react";
import "simplebar-react/dist/simplebar.min.css";
import { RouterProvider } from "react-router-dom";

import { client } from "api/clients";
import { getProduct, getProducts } from "api/firebase/products.api";
import { productsListener } from "api/sockets/products.sockets";
import { CheckoutComplete } from "components/confetti";
import { Providers } from "components/client";
import { router } from "router";
import "./index.css";

export const App = () => {
  const { onEvent } = useListener(productsListener, {});

  onEvent(({ data }) => {
    // Invalidate list as this is very dynamic endpoint with possible filters on
    client.cache.invalidate(getProducts.cacheKey);

    // Update single product cache as this is static endpoint
    data?.forEach((product) => {
      client.cache.update(getProduct.setParams({ productId: product.__key }), (oldData) => {
        return { ...oldData, ...data };
      });
    });
  });

  return (
    <Providers>
      <CssBaseline />
      <CheckoutComplete />
      <RouterProvider router={router} />
    </Providers>
  );
};
