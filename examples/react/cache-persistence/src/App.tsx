import { useFetch } from "@hyper-fetch/react";
import { useState } from "react";

import { client, getRecipes, persistedKeys } from "./api";

const PAGE_SIZE = 6;
const pageLoadedAt = Date.now();

const Recipes = ({ page }: { page: number }) => {
  // `revalidate: false` reads fresh cached data without a request. A stale or missing entry is fetched.
  const { data, error, loading, responseTimestamp } = useFetch(
    getRecipes.setQueryParams({
      limit: PAGE_SIZE,
      skip: page * PAGE_SIZE,
      // `select` and `delay` are dummyjson query params: return only these fields, answer after `delay` ms.
      select: "name,image,cuisine,difficulty",
      // A slow response, so the difference between network and cache is easy to see.
      delay: 1500,
    }),
    { revalidate: false },
  );

  if (loading && !data) return <p aria-busy="true">Loading recipes from the network...</p>;
  if (error) return <p className="error">Could not load recipes: {error.message}</p>;
  if (!data) return null;

  const fromStorage = responseTimestamp !== null && responseTimestamp.getTime() < pageLoadedAt;

  return (
    <section>
      <p>
        {fromStorage ? <mark>Read from localStorage</mark> : "Fetched from the network"}
        <small className="muted"> · saved at {responseTimestamp?.toLocaleTimeString()}</small>
      </p>
      <div className="recipes">
        {data.recipes.map((recipe) => (
          <article key={recipe.id}>
            <img src={recipe.image} alt="" loading="lazy" />
            <strong>{recipe.name}</strong>
            <small className="muted">
              {recipe.cuisine} · {recipe.difficulty}
            </small>
          </article>
        ))}
      </div>
      {/* Re-read on every render of this component, which happens whenever new data arrives. */}
      <details>
        <summary>Persisted cache keys</summary>
        <ul>
          {persistedKeys().map((key) => (
            <li key={key}>
              <code>{key}</code>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
};

export const App = () => {
  const [page, setPage] = useState(0);

  const clearAndReload = async () => {
    // Removes every entry from memory and from the storage.
    await client.cache.clear();
    window.location.reload();
  };

  return (
    <main className="container">
      <hgroup>
        <h1>Recipes</h1>
        <p>Open a few pages, then reload: everything you have seen shows up at once, without a request.</p>
      </hgroup>
      <div className="toolbar">
        <div role="group">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              type="button"
              className={index === page ? undefined : "outline secondary"}
              onClick={() => setPage(index)}
            >
              Page {index + 1}
            </button>
          ))}
        </div>
        <div role="group">
          <button type="button" className="secondary" onClick={() => window.location.reload()}>
            Reload page
          </button>
          <button type="button" className="outline" onClick={clearAndReload}>
            Clear persisted cache
          </button>
        </div>
      </div>
      <Recipes page={page} />
    </main>
  );
};
