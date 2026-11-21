import { useFetch } from "@hyper-fetch/react";
import { Link, useLocation, useSearchParams } from "react-router";

import { characterList, prefetchCharacter } from "../../api/characters";
import { getErrorMessage } from "../../api/client";
import { Pagination } from "../../components/Pagination";
import { StatusBadge } from "../../components/StatusBadge";

export const CharacterList = () => {
  // The search and the page live in the URL, so reload, back and shared links restore them.
  const [searchParams, setSearchParams] = useSearchParams();
  const { search } = useLocation();
  const name = searchParams.get("name") ?? "";
  const page = Number(searchParams.get("page") ?? 1);

  // Every page and search term has its own cache key. `revalidate: false` renders a fresh cached page without a request.
  // `bounce` waits until typing stops, and the previous page stays on screen while the new one loads.
  const { data, error, status, loading } = useFetch(characterList(page, name), {
    revalidate: false,
    bounce: true,
    bounceTime: 400,
  });

  const setSearch = (value: string) => setSearchParams(value ? { name: value } : {}, { replace: true });
  const setPage = (next: number) => setSearchParams(name ? { name, page: String(next) } : { page: String(next) });
  const prefetchPage = (next: number) => {
    if (data && next >= 1 && next <= data.info.pages) characterList(next, name).send({ cachePolicy: "cache-first" });
  };

  return (
    <section>
      <input
        type="search"
        value={name}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search characters"
        aria-label="Search characters"
        aria-busy={loading}
      />

      {/* The API answers a search without results with 404. */}
      {status === 404 && <p className="muted">No characters match "{name}".</p>}
      {error && status !== 404 && <p className="error">Could not load characters: {getErrorMessage(error)}</p>}
      {!data && loading && <p aria-busy="true">Loading characters...</p>}

      {data && status !== 404 && (
        <>
          <ul className="cards">
            {data.results.map((character) => (
              <li key={character.id}>
                {/* The details link keeps the search, so "Back" returns to the same page of results. */}
                <Link
                  to={`/characters/${character.id}${search}`}
                  onMouseEnter={() => prefetchCharacter(character.id)}
                  onFocus={() => prefetchCharacter(character.id)}
                >
                  <img src={character.image} alt="" loading="lazy" />
                  <strong>{character.name}</strong>
                  <StatusBadge status={character.status} />
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={page} pages={data.info.pages} onChange={setPage} onIntent={prefetchPage} />
        </>
      )}
    </section>
  );
};
