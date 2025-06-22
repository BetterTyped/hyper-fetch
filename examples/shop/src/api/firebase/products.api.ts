import { client } from "../clients";

export type ProductType = {
  __key: string;
  description: string;
  discount: number;
  image: string;
  name: string;
  novelty: boolean;
  price: number;
  promotion: boolean;
  quantity: number;
  spec: string[];
  visible: boolean;
};

export const getProducts = client.createRequest<{ response: ProductType[] }>()({
  method: "getDocs",
  endpoint: "/products",
  cacheKey: "products",
  queryKey: "products",
  deduplicate: true,
});

export const getProductsSearch = client.createRequest<{ response: ProductType[] }>()({
  method: "getDocs",
  endpoint: "/products",
  cacheKey: "products-search",
  queryKey: "products-search",
  deduplicate: true,
});

export const getProduct = client.createRequest<{ response: ProductType }>()({
  method: "getDoc",
  endpoint: "/products/:productId",
  deduplicate: true,
});

export const postProduct = client.createRequest<{ payload: ProductType }>()({
  method: "addDoc",
  endpoint: "/products",
});
