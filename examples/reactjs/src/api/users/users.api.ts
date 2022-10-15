import { DateInterval } from "@hyper-fetch/core";

import { PostUserModel, UserModel } from "models";
import { builder } from "../builder";

export const getUser = builder.createCommand<UserModel>()({
  endpoint: "/api/user/:userId",
  cache: true,
  cacheTime: DateInterval.second * 5,
});

export const getUsers = builder.createCommand<UserModel[]>()({
  endpoint: "/api/users",
  cache: true,
  cacheTime: DateInterval.second * 5,
});

export const postUser = builder.createCommand<UserModel, PostUserModel>()({
  endpoint: "/api/user",
  method: "POST",
  cancelable: true,
});

export const patchUser = builder.createCommand<UserModel, PostUserModel>()({
  endpoint: "/api/user/:userId",
  method: "PATCH",
  cancelable: false,
});

export const deleteUser = builder.createCommand()({
  endpoint: "/api/user/:userId",
  method: "DELETE",
});
