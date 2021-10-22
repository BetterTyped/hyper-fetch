/**
 * FetchMiddleware()
 *
 * endpoint
 * method
 * headers
 *
 * onRequestStart
 * onRequestProgress
 * onRequestProgress
 * onResponseStart
 * onResponseProgress
 * onResponseProgress
 * onSuccess
 * onError
 * onFinish
 *
 * setData
 * setParams
 * setQueryParams
 *
 * fetch()
 */

export class FetchMiddleware {}

// TYPESCRIPT TEST CASES

// const fetchMiddleware = new FetchBuilder({
//   baseUrl: "http://localhost:3000",
// }).build();

// const getUsers = fetchMiddleware<{ name: string }[]>()({
//   method: "get",
//   endpoint: "/users",
// });

// const getUser = fetchMiddleware<{ name: string }>()({
//   method: "get",
//   endpoint: "/users/:id",
// });

// const postUser = fetchMiddleware<{ name: string }, { name: string }>()({
//   method: "get",
//   endpoint: "/users",
// });

// const patchUser = fetchMiddleware<{ name: string }, { name: string }>()({
//   method: "get",
//   endpoint: "/users/:id",
// });

// // OK
// getUsers.fetch({ queryParams: "" });
// getUsers.setQueryParams("").fetch();
// // Fail
// getUsers.fetch({ data: "" });
// getUsers.fetch({ params: "" });
// getUsers.setQueryParams("").fetch({ queryParams: "" });

// // OK
// getUser.fetch({ params: { id: "" }, queryParams: "" });
// getUser.setParams({ id: "" }).fetch({ queryParams: "" });
// // Fail
// getUser.fetch({ queryParams: "" });
// getUser.fetch();
// getUser.setParams({ id: "" }).fetch({ params: { id: "" } });

// // OK
// postUser.fetch({ data: { name: "" } });
// postUser.setData({ name: "" }).fetch();
// // Fail
// postUser.fetch({ queryParams: "" });
// postUser.fetch({ data: null });
// postUser.fetch();
// postUser.setData({ name: "" }).fetch({ data: { name: "" } });

// // OK
// patchUser.fetch({ params: { id: "" }, data: { name: "" } });
// patchUser.setParams({ id: "" }).setData({ name: "" }).fetch();
// // Fail
// patchUser.fetch({ queryParams: "" });
// patchUser.fetch({ data: null });
// patchUser.fetch();
// patchUser
//   .setParams({ id: "" })
//   .setData({ name: "" })
//   .fetch({ data: { name: "" } });
// patchUser
//   .setParams({ id: "" })
//   .setData({ name: "" })
//   .fetch({ params: { id: "" } });

// const { payload, error } = useFetch(getUsers);
