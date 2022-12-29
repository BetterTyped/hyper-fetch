import { DateInterval } from "@hyper-fetch/core";

import { PostUserModel, UserModel } from "models";
import { client } from "../client";

export const getUser = client.createRequest<UserModel>()({
  endpoint: "/api/user/:userId",
  cache: true,
  cacheTime: DateInterval.second * 5,
});

export const getUsers = client.createRequest<UserModel[]>()({
  endpoint: "/api/users",
  cache: true,
  cacheTime: DateInterval.second * 5,
});

export const postUser = client.createRequest<UserModel, PostUserModel>()({
  endpoint: "/api/user",
  method: "POST",
  cancelable: true,
});

export const patchUser = client.createRequest<UserModel, PostUserModel>()({
  endpoint: "/api/user/:userId",
  method: "PATCH",
  cancelable: false,
});

export const deleteUser = client.createRequest()({
  endpoint: "/api/user/:userId",
  method: "DELETE",
});
