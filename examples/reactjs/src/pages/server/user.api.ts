import { DateInterval, FetchCommandInstance } from "@better-typed/hyper-fetch";
import { builder } from "pages/server/builder";
import { PostUserModel, UserModel } from "models";
import { rest, setupWorker } from "msw";
import { getRandomUser, getRandomUsers } from "utils/users.utils";

export const getUser = builder.createCommand<UserModel>()({
  endpoint: "/api/user/:userId",
  cacheTime: DateInterval.second * 10,
});

export const getUsers = builder.createCommand<UserModel[]>()({
  endpoint: "/api/users",
  cacheTime: DateInterval.second * 10,
});

export const postUser = builder.createCommand<UserModel, PostUserModel>()({
  endpoint: "/api/user",
  method: "POST",
});

export const patchUser = builder.createCommand<UserModel, PostUserModel>()({
  endpoint: "/api/user/:userId",
  method: "PATCH",
  cancelable: true,
});

export const deleteUser = builder.createCommand()({
  endpoint: "/api/user/:userId",
  method: "DELETE",
});

export const postQueue = builder.createCommand<{ response: string }, { id: number; name: string }>()({
  endpoint: "/api/queue",
  method: "POST",
  concurrent: false,
  retry: 0,
});

// Mocks setup
const getMock = (
  request: FetchCommandInstance,
  response: Record<string, any> | null | (() => Record<string, any> | null),
  delay?: number,
) => {
  const { method, endpoint } = request;

  const url = builder.baseUrl + endpoint;

  function callback(_req: any, res: any, ctx: any) {
    return res(
      ctx.delay(delay),
      ctx.status(200),
      ctx.json(typeof response === "function" ? response() : response || {}),
    );
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
  getMock(getUser, getRandomUser, DateInterval.second),
  getMock(getUsers, getRandomUsers, DateInterval.second),
  getMock(postUser, getRandomUser, DateInterval.second),
  getMock(patchUser, getRandomUser, DateInterval.second * 3),
  getMock(deleteUser, null),
  getMock(postQueue, { response: "FROM QUEUE!" }, DateInterval.second),
];

const restServer = setupWorker(...handlers);

restServer.start();
