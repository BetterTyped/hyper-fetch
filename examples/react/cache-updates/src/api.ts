import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  image: string;
};

/** Every component below uses this exact request, so they all read the same cache entry. */
export const getUserRequest = client
  .createRequest<{
    response: User;
    queryParams: { select: string };
  }>()({ endpoint: "/users/:userId" })
  .setParams({ userId: 1 })
  // `select` is a dummyjson query param: the API returns only these fields.
  .setQueryParams({ select: "firstName,lastName,email,image" });

/** Writes into the cache. Every hook that reads `getUserRequest` re-renders with the new data, no request is sent. */
export const updateCachedUser = (changes: Partial<User>) => {
  client.cache.update(getUserRequest, (cached) => (cached?.data ? { data: { ...cached.data, ...changes } } : {}));
};
