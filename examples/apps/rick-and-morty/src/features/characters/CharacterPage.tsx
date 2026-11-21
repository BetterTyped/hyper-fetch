import { useFetch } from "@hyper-fetch/react";
import { Link, useLocation, useParams } from "react-router";

import { characterDetails } from "../../api/characters";
import { getErrorMessage } from "../../api/client";
import { StatusBadge } from "../../components/StatusBadge";
import { Episodes } from "./Episodes";

export const CharacterPage = () => {
  const characterId = Number(useParams().characterId);
  const { search } = useLocation();
  // After a hover the character is in the cache already, so this renders without a loading state.
  const { data: character, error, status, loading } = useFetch(characterDetails(characterId), { revalidate: false });

  return (
    <section>
      <Link to={`/${search}`}>&larr; All characters</Link>

      {loading && !character && <article aria-busy="true">Loading character...</article>}
      {error && (
        <article className="error">
          {status === 404 ? "This character does not exist." : `Could not load it: ${getErrorMessage(error)}`}
        </article>
      )}

      {character && (
        <article>
          <div className="profile">
            <img src={character.image} alt="" />
            <div>
              <h2>{character.name}</h2>
              <p>
                <StatusBadge status={character.status} /> {character.species} · {character.gender}
              </p>
              <dl>
                <dt>Origin</dt>
                <dd>{character.origin.name}</dd>
                <dt>Last seen</dt>
                <dd>{character.location.name}</dd>
              </dl>
            </div>
          </div>
          <h3>Episodes ({character.episode.length})</h3>
          <Episodes character={character} />
        </article>
      )}
    </section>
  );
};
