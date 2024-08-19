import { HttpResponse, HttpResponseResolver, PathParams, delay, http } from "msw";
import { DefaultBodyType, ResponseResolverInfo } from "msw/lib/core/handlers/RequestHandler";
import { HttpRequestResolverExtras } from "msw/lib/core/handlers/HttpHandler";
import { RequestInstance, Time, getErrorMessage } from "@hyper-fetch/core";

import { getRandomUser, getRandomUsers } from "../utils";
import { client } from "./client";
import { deleteUser, getUser, getUsers, patchUser, postUser } from "./users/users.api";
import { postFile } from "./files/files.api";

// Mocks setup
const getMock = (
  request: RequestInstance,
  response:
    | Record<string, any>
    | null
    | ((
        details: ResponseResolverInfo<HttpRequestResolverExtras<PathParams>, DefaultBodyType>,
      ) => Record<string, any> | null),
  delayTime?: number,
) => {
  const { method, endpoint } = request;

  const url = client.url + endpoint;

  const requestResolver: HttpResponseResolver = async (details) => {
    if (delayTime) {
      await delay(delayTime);
    }

    const { requestManager } = request.client;
    const controllers = requestManager.abortControllers.get(request.abortKey);
    const size = controllers?.size || 0;
    const abortController = Array.from(controllers || [])[size - 1];

    if (abortController && abortController?.[1].signal.aborted) {
      const error = getErrorMessage("abort");
      return HttpResponse.json({ message: error.message }, { status: 0 });
    }

    return HttpResponse.json(typeof response === "function" ? response(details) : response, { status: 200 });
  };

  if ((method as string).toUpperCase() === "POST") {
    return http.post(url, requestResolver);
  }
  if ((method as string).toUpperCase() === "PUT") {
    return http.put(url, requestResolver);
  }
  if ((method as string).toUpperCase() === "PATCH") {
    return http.patch(url, requestResolver);
  }
  if ((method as string).toUpperCase() === "DELETE") {
    return http.delete(url, requestResolver);
  }
  return http.get(url, requestResolver);
};

const usersPages = new Map();

const getPage = (details: ResponseResolverInfo<HttpRequestResolverExtras<PathParams>, DefaultBodyType>) => {
  const url = new URL(details.request.url);
  const page = url.searchParams.get("page") || 1;
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
  getMock(getUser, getRandomUser, Time.SEC),
  getMock(getUsers, getPage, Time.SEC),
  getMock(postUser, getRandomUser, Time.SEC),
  getMock(patchUser, getRandomUser, Time.SEC * 3),
  getMock(deleteUser, null),
  getMock(postFile, { response: "ok" }, Time.SEC * 2),
];
