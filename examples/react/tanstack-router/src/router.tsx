import { useFetch } from "@hyper-fetch/react";
import { createRootRoute, createRoute, createRouter, Link, Outlet } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";

import { getNetworkLog, productDetails, productList, subscribeNetworkLog } from "./api";

const NetworkLog = () => {
  const log = useSyncExternalStore(subscribeNetworkLog, getNetworkLog);
  return (
    <article>
      <header>Requests sent to the network</header>
      <ul className="log">
        {log.map((line, index) => (
          <li key={`${index}-${line}`}>{line}</li>
        ))}
      </ul>
    </article>
  );
};

const rootRoute = createRootRoute({
  component: () => (
    <main className="container">
      <hgroup>
        <h1>Products</h1>
        <p>Hover a product: the router runs its loader, and HyperFetch fills the cache before you click.</p>
      </hgroup>
      <Outlet />
      <NetworkLog />
    </main>
  ),
});

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  // The loader only fills the HyperFetch cache. `cache-first` skips the request when the data is cached already.
  loader: async () => {
    await productList.send({ cachePolicy: "cache-first" });
  },
  component: () => {
    const { data, error } = useFetch(productList, { revalidate: false });
    if (error) return <p className="error">Could not load products: {error.message}</p>;
    return (
      <ul className="products">
        {data?.products.map((product) => (
          <li key={product.id}>
            {/* With `defaultPreload: "intent"`, hovering or focusing this link runs the product loader. */}
            <Link to="/products/$productId" params={{ productId: product.id }}>
              {product.title}
            </Link>{" "}
            <small className="muted">${product.price}</small>
          </li>
        ))}
      </ul>
    );
  },
});

const productRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products/$productId",
  // Path params are strings, parse them once so the loader and the component get a number.
  params: {
    parse: ({ productId }) => ({ productId: Number(productId) }),
    stringify: ({ productId }) => ({ productId: String(productId) }),
  },
  loader: async ({ params }) => {
    await productDetails(params.productId).send({ cachePolicy: "cache-first" });
  },
  pendingComponent: () => <p aria-busy="true">Loading the product (it was not prefetched)...</p>,
  component: function ProductPage() {
    const { productId } = productRoute.useParams();
    const { data, error } = useFetch(productDetails(productId), {
      revalidate: false,
    });
    if (error) return <p className="error">Could not load the product: {error.message}</p>;
    if (!data) return null;

    return (
      <article>
        <header>
          <Link to="/">Back to products</Link>
          <h2>{data.title}</h2>
          <small className="muted">
            {data.brand ?? "No brand"} · rated {data.rating} · {data.stock} in stock
          </small>
        </header>
        <p>{data.description}</p>
        <strong>${data.price}</strong>
      </article>
    );
  },
});

export const router = createRouter({
  routeTree: rootRoute.addChildren([productsRoute, productRoute]),
  defaultPreload: "intent",
  // HyperFetch owns the cache and its stale time, so the router should not keep preloaded results itself.
  defaultPreloadStaleTime: 0,
  // Show the pending component right away instead of after the default delay.
  defaultPendingMs: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
