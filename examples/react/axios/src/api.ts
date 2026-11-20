import { AxiosAdapter } from "@hyper-fetch/axios";
import { createClient } from "@hyper-fetch/core";
import type { AxiosError } from "axios";

/** Same client API as always. `setAdapter` swaps the transport, and failed requests carry the AxiosError. */
export const client = createClient<{ error: AxiosError }>({ url: "https://dummyjson.com" }).setAdapter(AxiosAdapter);

export type Product = { id: number; title: string; price: number; thumbnail: string };

export const getProducts = client.createRequest<{
  response: { products: Product[]; total: number };
  queryParams: { limit: number; select: string; delay: number };
}>()({
  endpoint: "/products",
  // `options` is the axios request config, typed by the adapter. HyperFetch passes it straight to axios.
  options: {
    // Axios aborts the request after 2 seconds...
    timeout: 2000,
    // ...and reports it with the `ETIMEDOUT` code instead of the generic `ECONNABORTED`.
    transitional: { clarifyTimeoutError: true },
  },
});
