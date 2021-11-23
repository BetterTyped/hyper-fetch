import { rest, setupWorker } from "msw";
import { FetchMiddlewareInstance } from "@better-typed/react-fetch";
import { getRandomUser, getRandomUsers } from "utils/users.utils";
import { restMiddleware } from "pages/rest/server/middleware";
import { PostUserModel, UserModel } from "models";

export const getUser = restMiddleware<UserModel>()({
  endpoint: "/api/user/:userId",
});

export const getUsers = restMiddleware<UserModel[]>()({
  endpoint: "/api/users",
});

export const postUser = restMiddleware<UserModel, PostUserModel>()({
  endpoint: "/api/user",
  method: "POST",
});

export const patchUser = restMiddleware<UserModel, PostUserModel>()({
  endpoint: "/api/user/:userId",
  method: "PATCH",
});

export const deleteUser = restMiddleware()({
  endpoint: "/api/user/:userId",
  method: "DELETE",
});

// Mocks setup
const getMock = (request: FetchMiddlewareInstance, response: Record<string, any> | null) => {
  const { method, endpoint, builderConfig } = request;

  const url = builderConfig.baseUrl + endpoint;

  function callback(_req: any, res: any, ctx: any) {
    return res(ctx.delay(), ctx.status(200), ctx.json(response || {}));
  }

  if (method.toUpperCase() === "POST") {
    return rest.post(url, callback);
  }
  if (method.toUpperCase() === "PUT") {
    return rest.put(url, callback);
  }
  if (method.toUpperCase() === "PATCH") {
    return rest.patch(url, callback);
  }
  if (method.toUpperCase() === "DELETE") {
    return rest.delete(url, callback);
  }
  return rest.get(url, callback);
};

const handlers = [
  getMock(getUser, getRandomUser()),
  getMock(getUsers, getRandomUsers()),
  getMock(postUser, getRandomUser()),
  getMock(patchUser, getRandomUser()),
  getMock(deleteUser, null),
];

const restServer = setupWorker(...handlers);

restServer.start();
