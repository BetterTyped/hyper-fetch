import type { Cart, CartLine } from "./cart";
import { client } from "./client";

export type Shipping = { name: string; email: string; address: string };
export type FieldErrors = Partial<Record<keyof Shipping, string>>;
export type Order = Pick<Cart, "id" | "products" | "total" | "discountedTotal" | "totalQuantity">;

/** Thrown by the request mapper below. HyperFetch returns it as `error`, so the form can show it per field. */
export class ValidationError extends Error {
  constructor(public fields: FieldErrors) {
    super("Check the highlighted fields");
  }
}

const validate = ({ name, email, address }: Shipping) => {
  const fields: FieldErrors = {};
  if (name.trim().length < 2) fields.name = "Enter your full name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fields.email = "Enter a valid email";
  if (address.trim().length < 10) fields.address = "Enter the street, number and city";
  if (Object.keys(fields).length > 0) throw new ValidationError(fields);
};

/** dummyjson creates the order with `/carts/add`. It answers 400 when the cart is empty. */
export const placeOrder = client
  .createRequest<{
    response: Order;
    payload: { userId: number; products: Pick<CartLine, "id" | "quantity">[]; shipping: Shipping };
    error: ValidationError;
  }>()({
    endpoint: "/carts/add",
    method: "POST",
    cache: false,
  })
  // Runs right before the request is sent. A throw ends it with that error, and nothing reaches the network.
  .setRequestMapper((request) => {
    if (request.payload) validate(request.payload.shipping);
    return request;
  });
