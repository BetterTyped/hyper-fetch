import { middleware } from "./middleware";

export const getUser = middleware<{ name: string }[]>()({
  endpoint: "/api/user/:userId",
});

export const getUsers = middleware<{ name: string }[]>()({
  endpoint: "/api/users",
});

export const postUser = middleware<{ name: string }, { email: string }>()({
  endpoint: "/api/user",
  method: "POST",
});

export const patchUser = middleware<{ name: string }, { email: string }>()({
  endpoint: "/api/user/:userId",
  method: "PATCH",
});

export const deleteUser = middleware()({
  endpoint: "/api/user/:userId",
  method: "DELETE",
});
