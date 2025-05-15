import { Time } from "@hyper-fetch/core";

import { PostUserModel, UserModel } from "../../models";
import { client } from "../client";

export const getUser = client.createRequest<{ response: UserModel; queryParams?: any }>()({
  endpoint: "/api/user/:userId",
  cache: true,
  staleTime: Time.SEC * 10,
});

export const getUsers = client.createRequest<{ response: UserModel[] }>()({
  endpoint: "/api/users",
  cache: true,
  staleTime: Time.SEC * 5,
});

export const postUser = client.createRequest<{ response: UserModel; payload: PostUserModel }>()({
  endpoint: "/api/user",
  method: "POST",
  cancelable: true,
});

export const patchUser = client.createRequest<{ response: UserModel; payload: PostUserModel }>()({
  endpoint: "/api/user/:userId",
  method: "PATCH",
  cancelable: false,
});

export const deleteUser = client.createRequest()({
  endpoint: "/api/user/:userId",
  method: "DELETE",
});
