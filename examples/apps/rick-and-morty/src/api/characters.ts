import { Time } from "@hyper-fetch/core";

import { type ApiError, client } from "./client";

export type CharacterStatus = "Alive" | "Dead" | "unknown";

export type Character = {
  id: number;
  name: string;
  status: CharacterStatus;
  species: string;
  gender: string;
  image: string;
  origin: { name: string };
  location: { name: string };
  /** Urls of the episodes, for example `https://rickandmortyapi.com/api/episode/1`. */
  episode: string[];
};

export type Episode = { id: number; name: string; air_date: string; episode: string };

type Page<T> = { info: { count: number; pages: number; next: string | null; prev: string | null }; results: T[] };

const getCharacters = client.createRequest<{
  response: Page<Character>;
  queryParams: { page: number; name?: string };
  error: ApiError;
}>()({
  endpoint: "/character",
  // Characters do not change, so a page stays fresh for 10 minutes: going back to it sends no request.
  staleTime: 10 * Time.MIN,
});

const getCharacter = client.createRequest<{ response: Character; error: ApiError }>()({
  endpoint: "/character/:characterId",
  staleTime: 10 * Time.MIN,
  // Hovering a link several times while the prefetch is running shares that one call.
  deduplicate: true,
});

const getEpisodes = client.createRequest<{ response: Episode[]; error: ApiError }>()({
  endpoint: "/episode/:episodeIds",
  staleTime: 10 * Time.MIN,
  deduplicate: true,
});

// The list, the prefetch and the details page build their requests with these functions,
// so they always share the same cache keys.

export const characterList = (page: number, name: string) =>
  getCharacters.setQueryParams(name ? { page, name } : { page });

export const characterDetails = (characterId: number) => getCharacter.setParams({ characterId });

/** The API answers `/episode/[1,2]` with an array, also for a single id. */
export const characterEpisodes = (character: Character) => {
  const ids = character.episode.map((url) => url.split("/").pop());
  return getEpisodes.setParams({ episodeIds: `[${ids.join(",")}]` });
};

/** Loads a character and its episodes into the cache before the user opens the page. */
export const prefetchCharacter = async (characterId: number) => {
  // `cache-first` returns cached data without a request, so hovering the same link again is free.
  const { data } = await characterDetails(characterId).send({ cachePolicy: "cache-first" });
  if (data) await characterEpisodes(data).send({ cachePolicy: "cache-first" });
};
