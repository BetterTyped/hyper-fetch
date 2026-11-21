import { createClient } from "@hyper-fetch/core";
import type { Pagination } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Product = { id: number; title: string; brand?: string; price: number };

/** Pages must be taller than the screen, or dropping one at the top would bring the spacer into view at once. */
export const pageSize = 20;

export const getProductsRequest = client
  .createRequest<{
    response: { products: Product[]; total: number; skip: number; limit: number };
    queryParams: { limit: number; skip?: number; select: string };
  }>()({ endpoint: "/products" })
  // `select` is a dummyjson query param: the API returns only these fields.
  .setQueryParams({ limit: pageSize, select: "title,brand,price" });

/** dummyjson pages with `skip` and `limit`. With an offset, the hook can also compute the page before the first one. */
export const productsPagination = {
  offset: "skip",
  limit: "limit",
  items: "products",
  total: "total",
} satisfies Pagination<typeof getProductsRequest>;
