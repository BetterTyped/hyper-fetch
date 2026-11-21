import { useFetch, useSubmit } from "@hyper-fetch/react";

import { type CartLine, changeQuantity, getCart, saveCart, toPayload } from "../../api/cart";

type CartProduct = Omit<CartLine, "quantity">;

/** The cart for every screen: the header badge, the product page and the cart page all read the same cache entry. */
export const useCart = () => {
  // The cart is persisted in localStorage. `revalidate: false` keeps it instead of asking dummyjson again.
  const { data: cart, error, loading } = useFetch(getCart, { revalidate: false });
  const { submit, submitting, error: saveError } = useSubmit(saveCart);

  const change = (product: CartProduct, delta: number) => {
    if (!cart) return;

    submit({
      payload: toPayload(changeQuantity(cart, product, delta)),
      // The change needs the product's title and price, which the payload does not carry, so it is passed per call
      // instead of with `setOptimistic` on the request.
      optimistic: ({ optimistic }) => ({
        updates: [
          optimistic(getCart)
            .set((data) => changeQuantity(data, product, delta))
            // The lines are ours, the prices are the server's.
            .commit(({ data, response }) => ({
              ...data,
              total: response.data.total,
              discountedTotal: response.data.discountedTotal,
            }))
            // Undo only this change, so other changes made in the meantime stay.
            .rollback(({ data }) => changeQuantity(data, product, -delta)),
        ],
        // dummyjson does not store the cart. Refetching it after the save would bring the old one back.
        revalidate: false,
      }),
    });
  };

  return {
    cart,
    error,
    loading,
    saving: submitting,
    saveError,
    add: (product: CartProduct) => change(product, 1),
    remove: (product: CartProduct) => change(product, -1),
  };
};
