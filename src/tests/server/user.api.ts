import { middleware } from "./middleware";

export const getUser = middleware()({
  endpoint: "/api/user/:userId",
  method: "GET",
});

export const getUsers = middleware()({
  endpoint: "/api/users",
  method: "GET",
});

export const postUser = middleware()({
  endpoint: "/api/user",
  method: "POST",
});

export const patchUser = middleware()({
  endpoint: "/api/user/:userId",
  method: "PATCH",
});

export const deleteUser = middleware()({
  endpoint: "/api/user/:userId",
  method: "DELETE",
});
