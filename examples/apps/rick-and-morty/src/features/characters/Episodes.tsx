import { useFetch } from "@hyper-fetch/react";

import { type Character, characterEpisodes } from "../../api/characters";
import { getErrorMessage } from "../../api/client";

/** A dependent request: the episode ids come from the character, so this renders only once the character is loaded. */
export const Episodes = ({ character }: { character: Character }) => {
  const { data, error, loading } = useFetch(characterEpisodes(character), { revalidate: false });

  if (loading && !data) return <p aria-busy="true">Loading episodes...</p>;
  if (error) return <p className="error">Could not load episodes: {getErrorMessage(error)}</p>;

  return (
    <table className="striped">
      <thead>
        <tr>
          <th>Episode</th>
          <th>Title</th>
          <th>Aired</th>
        </tr>
      </thead>
      <tbody>
        {data?.map((episode) => (
          <tr key={episode.id}>
            <td>
              <code>{episode.episode}</code>
            </td>
            <td>{episode.name}</td>
            <td className="muted">{episode.air_date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
