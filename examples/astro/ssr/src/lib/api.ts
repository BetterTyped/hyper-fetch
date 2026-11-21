import { createClient } from "@hyper-fetch/core";

/** One client for the Astro server and the browser. On the server it runs in server mode and keeps no shared cache. */
export const client = createClient({ url: "https://dummyjson.com" });

export type Recipe = {
  id: number;
  name: string;
  cuisine: string;
  difficulty: string;
  prepTimeMinutes: number;
};
export type RecipeDetails = Recipe & {
  ingredients: string[];
  instructions: string[];
};

const getRecipes = client.createRequest<{
  response: { recipes: Recipe[] };
  queryParams: { limit: number; select: string };
}>()({
  endpoint: "/recipes",
});

/** The Astro page and the React island import this request, so they build the same cache key. */
export const popularRecipes = getRecipes.setQueryParams({
  limit: 6,
  // `select` is a dummyjson query param: the API returns only these fields.
  select: "name,cuisine,difficulty,prepTimeMinutes",
});

export const getRecipe = client.createRequest<{
  response: RecipeDetails;
  queryParams: { select: string };
}>()({
  endpoint: "/recipes/:recipeId",
});
