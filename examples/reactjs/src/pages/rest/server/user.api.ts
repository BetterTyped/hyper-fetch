import { DateInterval } from "@better-typed/hyper-fetch";
import { builder } from "pages/rest/server/builder";
import { PostUserModel, UserModel } from "models";

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
});

export const deleteUser = builder.createCommand()({
  endpoint: "/api/user/:userId",
  method: "DELETE",
});

// // Mocks setup
// const getMock = (request: FetchCommandInstance, response: Record<string, any> | null) => {
//   const { method, endpoint, builder } = request;

//   const url = builder.baseUrl + endpoint;

//   function callback(_req: any, res: any, ctx: any) {
//     return res(ctx.delay(), ctx.status(200), ctx.json(response || {}));
//   }

//   if (method.toUpperCase() === "POST") {
//     return rest.post(url, callback);
//   }
//   if (method.toUpperCase() === "PUT") {
//     return rest.put(url, callback);
//   }
//   if (method.toUpperCase() === "PATCH") {
//     return rest.patch(url, callback);
//   }
//   if (method.toUpperCase() === "DELETE") {
//     return rest.delete(url, callback);
//   }
//   return rest.get(url, callback);
// };

// const handlers = [
//   getMock(getUser, getRandomUser()),
//   getMock(getUsers, getRandomUsers()),
//   getMock(postUser, getRandomUser()),
//   getMock(patchUser, getRandomUser()),
//   getMock(deleteUser, null),
// ];

// const restServer = setupWorker(...handlers);

// restServer.start();
