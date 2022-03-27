import { DateInterval, FetchCommandInstance } from "@better-typed/hyper-fetch";
import { builder, publicApiBuilder } from "pages/server/builder";
import { PostUserModel, UserModel } from "models";
import { rest, setupWorker } from "msw";
import { getRandomUser, getRandomUsers } from "utils/users.utils";

export const getUser = builder.createCommand<UserModel>()({
  endpoint: "/api/user/:userId",
  cache: true,
  cacheTime: DateInterval.second * 10,
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

export const postQueue = builder.createCommand<{ response: string }, { id: number; name: string }>()({
  endpoint: "/api/queue",
  method: "POST",
  concurrent: false,
  retry: 0,
});

export const getPublicApis = publicApiBuilder.createCommand<{ response: string }, { id: number; name: string }>()({
  endpoint: "",
  method: "GET",
  retry: 0,
  deduplicate: true,
});

// Mocks setup
const getMock = (
  request: FetchCommandInstance,
  response: Record<string, any> | null | ((req: any) => Record<string, any> | null),
  delay?: number,
) => {
  const { method, endpoint } = request;

  const url = builder.baseUrl + endpoint;

  function callback(req: any, res: any, ctx: any) {
    return res(
      ctx.delay(delay),
      ctx.status(200),
      ctx.json(typeof response === "function" ? response(req) : response || {}),
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

const usersPages = new Map();

const getPage = (req: any) => {
  const page = req.url.searchParams.get("page") || 1;
  const cachedData = usersPages.get(page);

  if (!cachedData) {
    const users = getRandomUsers();
    const newData = {
      page,
      data: users,
    };
    usersPages.set(page, newData);
    return newData;
  }
  return cachedData;
};

const handlers = [
  getMock(getUser, getRandomUser, DateInterval.second),
  getMock(getUsers, getPage, DateInterval.second),
  getMock(postUser, getRandomUser, DateInterval.second),
  getMock(patchUser, getRandomUser, DateInterval.second * 3),
  getMock(deleteUser, null),
  getMock(postQueue, { response: "FROM QUEUE!" }, DateInterval.second),
];

const restServer = setupWorker(...handlers);

restServer.start();
