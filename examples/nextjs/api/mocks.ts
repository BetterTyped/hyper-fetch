import { rest } from "msw";
import { CommandInstance, DateInterval } from "@hyper-fetch/core";

import { getRandomUser, getRandomUsers } from "utils";
import { builder } from "./builder";
import { deleteUser, getUser, getUsers, patchUser, postUser } from "./users/users.api";
import { postFile } from "./files/files.api";

// Mocks setup
const getMock = (
  request: CommandInstance,
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

export const handlers = [
  getMock(getUser, getRandomUser, DateInterval.second),
  getMock(getUsers, getPage, DateInterval.second),
  getMock(postUser, getRandomUser, DateInterval.second),
  getMock(patchUser, getRandomUser, DateInterval.second * 3),
  getMock(deleteUser, null),
  getMock(postFile, { response: "ok" }, DateInterval.second * 2),
];
