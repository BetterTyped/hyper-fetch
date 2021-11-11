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
}).mock(() => [userMock, null, 200]);

export const getUsers = middleware<UserModel[]>()({
  endpoint: "/api/users",
}).mock(() => [[userMock, userMock, userMock], null, 200]);

export const postUser = middleware<UserModel, PostUserModel>()({
  endpoint: "/api/user",
  method: "POST",
}).mock((data) => [{ ...userMock, ...data }, null, 201]);

export const patchUser = middleware<UserModel, PostUserModel>()({
  endpoint: "/api/user/:userId",
  method: "PATCH",
}).mock((data) => [{ ...userMock, ...data }, null, 201]);

export const deleteUser = middleware()({
  endpoint: "/api/user/:userId",
  method: "DELETE",
}).mock(() => [null, null, 200]);
