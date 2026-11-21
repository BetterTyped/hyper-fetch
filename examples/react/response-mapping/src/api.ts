import { createClient } from "@hyper-fetch/core";
import { z } from "zod";

export const client = createClient({ url: "https://dummyjson.com" });

/** What the API sends. Parsing it checks every field the UI relies on. */
const apiProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number(),
  discountPercentage: z.number(),
  stock: z.number().int(),
  thumbnail: z.url(),
});

/** `transform` turns the API shape into the shape the app wants to render. */
const productsSchema = z
  .object({ products: z.array(apiProductSchema), total: z.number() })
  .transform(({ products, total }) => ({
    total,
    items: products.map((product) => ({
      id: product.id,
      name: product.title,
      image: product.thumbnail,
      price: product.price,
      salePrice: Math.round(product.price * (100 - product.discountPercentage)) / 100,
      inStock: product.stock > 0,
    })),
  }));

export type ApiProducts = z.input<typeof productsSchema>;
export type Products = z.output<typeof productsSchema>;
export type Product = Products["items"][number];

/** All fields the schema needs. Dropping one simulates an API change the frontend did not expect. */
export const FIELDS = "title,price,discountPercentage,stock,thumbnail";

export const getProducts = client
  .createRequest<{ response: ApiProducts; queryParams: { limit: number; select: string } }>()({
    endpoint: "/products",
  })
  // Runs on every response, for `send()` and for the hooks. Its return value is what the app receives.
  .setResponseMapper((response) => {
    if (!response.success) return response;

    const result = productsSchema.safeParse(response.data);
    if (!result.success) {
      // Invalid data becomes a failed response: `success: false` and the ZodError as `error`.
      return { ...response, data: null, error: result.error, success: false as const };
    }

    return { ...response, data: result.data };
  });
