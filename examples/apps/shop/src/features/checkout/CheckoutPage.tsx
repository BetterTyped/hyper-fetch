import { useSubmit } from "@hyper-fetch/react";
import type { FormEvent } from "react";
import { Link } from "react-router";

import { getCart, toPayload } from "../../api/cart";
import { placeOrder, ValidationError } from "../../api/checkout";
import { client } from "../../api/client";
import { Price } from "../../components/Price";
import { useCart } from "../cart/use-cart";

export const CheckoutPage = () => {
  const { cart } = useCart();
  const { submit, submitting, data: order, error, onSubmitSuccess } = useSubmit(placeOrder);
  // A `ValidationError` comes from the request mapper, anything else from the server or the network.
  const fieldErrors = error instanceof ValidationError ? error.fields : {};

  onSubmitSuccess(() => {
    // The order is placed: empty the cart in the cache, which also saves the empty cart to localStorage.
    client.cache.update(getCart, (cached) =>
      cached?.data ? { data: { ...cached.data, products: [], totalQuantity: 0, total: 0, discountedTotal: 0 } } : {},
    );
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cart) return;
    const form = new FormData(event.currentTarget);
    submit({
      payload: {
        userId: 1,
        products: toPayload(cart).products,
        shipping: {
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          address: String(form.get("address") ?? ""),
        },
      },
    });
  };

  if (order) {
    return (
      <article>
        <h1>Thank you!</h1>
        <p>
          Order #{order.id} with {order.totalQuantity} item(s) is placed. You paid{" "}
          <Price value={order.discountedTotal} />.
        </p>
        <Link to="/">Continue shopping</Link>
      </article>
    );
  }

  return (
    <article>
      <h1>Checkout</h1>
      <p className="muted">
        {cart?.totalQuantity ?? 0} item(s), <Price value={cart?.discountedTotal ?? 0} /> with discounts.
      </p>
      {/* `noValidate`: the request validates the fields, so the browser does not stop the submit first. */}
      <form onSubmit={handleSubmit} noValidate>
        <label>
          Full name
          <input name="name" autoComplete="name" aria-invalid={fieldErrors.name ? true : undefined} />
          {fieldErrors.name && <small>{fieldErrors.name}</small>}
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" aria-invalid={fieldErrors.email ? true : undefined} />
          {fieldErrors.email && <small>{fieldErrors.email}</small>}
        </label>
        <label>
          Shipping address
          <textarea
            name="address"
            rows={2}
            autoComplete="street-address"
            aria-invalid={fieldErrors.address ? true : undefined}
          />
          {fieldErrors.address && <small>{fieldErrors.address}</small>}
        </label>
        {error && !(error instanceof ValidationError) && <p className="error">{error.message}</p>}
        <button type="submit" aria-busy={submitting} disabled={submitting}>
          Place order
        </button>
      </form>
    </article>
  );
};
