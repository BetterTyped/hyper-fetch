import { middleware } from "../middleware";
import { UserModel, PostUserModel } from "../../models";

const userMock: UserModel = {
  id: 12312,
  name: "Maciej",
  email: "testmail@local.com",
  age: 12312,
};

export const getUser = middleware<UserModel>()({
  endpoint: "/api/user/:userId",
});

export const getUsers = middleware<UserModel[]>()({
  endpoint: "/api/users",
});

export const postUser = middleware<UserModel, PostUserModel>()({
  endpoint: "/api/user",
  method: "POST",
});

export const patchUser = middleware<UserModel, PostUserModel>()({
  endpoint: "/api/user/:userId",
  method: "PATCH",
});

export const deleteUser = middleware()({
  endpoint: "/api/user/:userId",
  method: "DELETE",
});
