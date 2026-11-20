import { Hydrate, type HydrateProps, useFetch } from "@hyper-fetch/react";
import { useState } from "react";

import { client, getRecipe, popularRecipes } from "../lib/api";

const Ingredients = ({ recipeId }: { recipeId: number }) => {
  // Not part of the server render: this request starts in the browser when you open a recipe.
  const { data, error, loading } = useFetch(
    getRecipe.setParams({ recipeId }).setQueryParams({ select: "ingredients" }),
  );

  if (loading && !data) return <p aria-busy="true">Loading ingredients in the browser...</p>;
  if (error || !data) return <p className="error">Could not load the ingredients.</p>;
  return <p className="muted">{data.ingredients.join(", ")}</p>;
};

const RecipeList = () => {
  const [opened, setOpened] = useState<number | null>(null);
  // The first render already has the server data: no loading state and, while it is fresh, no request.
  const { data, error, loading, refetch } = useFetch(popularRecipes, {
    revalidate: false,
  });

  if (loading && !data) return <p aria-busy="true">Loading recipes...</p>;
  if (error || !data) return <p className="error">Could not load recipes.</p>;

  return (
    <>
      <header className="toolbar muted">
        <span>{data.recipes.length} recipes, rendered by Astro</span>
        <button type="button" className="outline secondary" onClick={refetch} disabled={loading}>
          Refetch in the browser
        </button>
      </header>
      {data.recipes.map((recipe) => (
        <article key={recipe.id}>
          <strong>{recipe.name}</strong>
          <br />
          <small className="muted">
            {recipe.cuisine} · {recipe.difficulty} · {recipe.prepTimeMinutes} min
          </small>
          <details open={opened === recipe.id} onToggle={(event) => event.currentTarget.open && setOpened(recipe.id)}>
            <summary>Ingredients</summary>
            {opened === recipe.id && <Ingredients recipeId={recipe.id} />}
          </details>
        </article>
      ))}
    </>
  );
};

/** The island: `Hydrate` writes the response from the Astro page into the client cache before the hooks mount. */
export const Recipes = ({ hydration }: { hydration: HydrateProps["data"] }) => (
  <Hydrate client={client} data={hydration}>
    <RecipeList />
  </Hydrate>
);
