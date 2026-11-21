import { type Pagination, Time } from "@hyper-fetch/core";

import { client } from "./client";

export type ProductSummary = { id: number; title: string; price: number; thumbnail: string; rating: number };
export type Product = ProductSummary & {
  description: string;
  brand?: string;
  category: string;
  stock: number;
  images: string[];
};
export type Category = { slug: string; name: string };

type ProductPage = { products: ProductSummary[]; total: number; skip: number; limit: number };
type PageQuery = { limit: number; skip?: number; select: string };

// `select` is a dummyjson query param: the API returns only these fields.
const PAGE = { limit: 12, select: "title,price,thumbnail,rating" };

export const getCategories = client.createRequest<{ response: Category[] }>()({
  endpoint: "/products/categories",
  staleTime: Time.HOUR,
});

const listProducts = client.createRequest<{ response: ProductPage; queryParams: PageQuery }>()({
  endpoint: "/products",
});

const searchProducts = client.createRequest<{ response: ProductPage; queryParams: PageQuery & { q: string } }>()({
  endpoint: "/products/search",
});

const listCategory = client.createRequest<{ response: ProductPage; queryParams: PageQuery }>()({
  endpoint: "/products/category/:category",
});

export const getProduct = client.createRequest<{ response: Product }>()({
  endpoint: "/products/:productId",
  staleTime: 5 * Time.MIN,
});

export type CatalogFilters = { q: string; category: string | null };

/** dummyjson has one endpoint for a search and one for a category. The catalog picks the one the filters need. */
export const catalogRequest = ({ q, category }: CatalogFilters) => {
  if (q) return searchProducts.setQueryParams({ ...PAGE, q });
  if (category) return listCategory.setParams({ category }).setQueryParams(PAGE);
  return listProducts.setQueryParams(PAGE);
};

/** The three endpoints page the same way, with `skip` and `limit`. */
export const catalogPagination = {
  offset: "skip",
  limit: "limit",
  items: "products",
  total: "total",
} satisfies Pagination<typeof listProducts>;
