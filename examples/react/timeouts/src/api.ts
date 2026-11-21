import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

// The fetch adapter aborts every request after 5 s by default. Change it for the whole client:
client.adapter.setAdapterDefaults(() => ({ timeout: 4000 }));

export type Product = { id: number; title: string; price: number; thumbnail: string };

export const getProduct = client
  .createRequest<{ response: Product; queryParams: { delay: number; select: string } }>()({
    endpoint: "/products/1",
    // Adapter options for this request only. They win over the defaults above.
    options: { timeout: 2000 },
  })
  // `select` and `delay` are dummyjson query params: return only these fields, answer after `delay` ms.
  .setQueryParams({ delay: 1000, select: "title,price,thumbnail" });
