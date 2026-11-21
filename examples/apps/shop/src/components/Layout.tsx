import { useIsFetching } from "@hyper-fetch/react";
import { Link, NavLink, Outlet } from "react-router";

import { client } from "../api/client";
import { useCart } from "../features/cart/use-cart";

export const Layout = () => {
  const { cart, saving } = useCart();
  const fetching = useIsFetching(client);

  return (
    <>
      <header className="container">
        <nav>
          <ul>
            <li>
              <Link to="/">
                <strong>HyperShop</strong>
              </Link>
            </li>
            {fetching > 0 && (
              <li>
                <small aria-busy="true" className="muted">
                  Loading
                </small>
              </li>
            )}
          </ul>
          <ul>
            <li>
              <NavLink to="/">Catalog</NavLink>
            </li>
            <li>
              {/* Updates the moment a product is added, before the server answers. */}
              <NavLink to="/cart" aria-busy={saving}>
                Cart <mark>{cart?.totalQuantity ?? 0}</mark>
              </NavLink>
            </li>
          </ul>
        </nav>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
};
