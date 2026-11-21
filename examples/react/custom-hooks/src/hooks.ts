import { useFetch, useSubmit } from "@hyper-fetch/react";

import { client, getPostRequest, getPostsRequest, updatePostRequest } from "./api";

/** The list every screen shows. Components never repeat the query params. */
// `select` is a dummyjson query param: the API returns only these fields.
const postsListRequest = getPostsRequest.setQueryParams({ limit: 5, select: "title,body,userId" });

/** Options all posts hooks share. Change them here, not in every component. */
const sharedOptions = { refetchOnReconnect: true };

/** `data` is typed as `{ posts: Post[]; total: number }` without a single type in the component. */
export const usePosts = () => useFetch(postsListRequest, sharedOptions);

export const usePost = (postId: number) => useFetch(getPostRequest.setParams({ postId }), sharedOptions);

/** Hides the request, the payload shape and the cache updates behind one function. */
export const useRenamePost = (postId: number) => {
  const { submit, submitting, error, onSubmitSuccess } = useSubmit(updatePostRequest.setParams({ postId }));

  // dummyjson does not store changes, so the saved title is written into both cached copies of the post.
  onSubmitSuccess(({ response }) => {
    const { title } = response.data;
    client.cache.update(getPostRequest.setParams({ postId }), (cached) =>
      cached?.data ? { data: { ...cached.data, title } } : {},
    );
    client.cache.update(postsListRequest, (cached) =>
      cached?.data
        ? {
            data: {
              ...cached.data,
              posts: cached.data.posts.map((post) => (post.id === postId ? { ...post, title } : post)),
            },
          }
        : {},
    );
  });

  const renamePost = (title: string) => submit({ payload: { title } });

  return { renamePost, submitting, error };
};
