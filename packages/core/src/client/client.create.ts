import {
  AdapterInstance,
  Client,
  ClientErrorType,
  ClientOptionsType,
  DefaultEndpointMapper,
  TypeWithDefaults,
} from "@hyper-fetch/core";

export function createClient<
  ClientProperties extends {
    error?: any;
    adapter?: any;
    mapper?: any;
  } = {
    error?: ClientErrorType;
    adapter?: AdapterInstance;
    mapper?: DefaultEndpointMapper;
  },
>(
  options: ClientOptionsType<
    Client<
      TypeWithDefaults<ClientProperties, "error", ClientErrorType>,
      TypeWithDefaults<ClientProperties, "adapter", AdapterInstance>,
      TypeWithDefaults<ClientProperties, "mapper", DefaultEndpointMapper>
    >
  >,
): Client<
  TypeWithDefaults<ClientProperties, "error", ClientErrorType>,
  TypeWithDefaults<ClientProperties, "adapter", AdapterInstance>,
  TypeWithDefaults<ClientProperties, "mapper", DefaultEndpointMapper>
> {
  return new Client<
    TypeWithDefaults<ClientProperties, "error", ClientErrorType>,
    TypeWithDefaults<ClientProperties, "adapter", AdapterInstance>,
    TypeWithDefaults<ClientProperties, "mapper", DefaultEndpointMapper>
  >(options);
}

/**
 * Typescript test cases - copied from request and remapped
 */

// const client = createClient({
//   url: "http://localhost:3000",
// });
//
// const getUsers = client.createRequest<{ response: { id: string }[] }>()({
//   method: "GET",
//   endpoint: "/users",
// });
//
// const getUser = client.createRequest<{ response: { id: string } }>()({
//   method: "GET",
//   endpoint: "/users/:id",
// });
//
// const postUser = client.createRequest<{ response: { id: string }; payload: { name: string } }>()({
//   method: "POST",
//   endpoint: "/users",
// });
//
// const patchUser = client.createRequest<{ response: { id: string }; payload: { name: string } }>()({
//   method: "PATCH",
//   endpoint: "/users/:id",
// });
//
// const mappedReq = client
//   .createRequest<{ response: { id: string }; payload: { name: string } }>()({
//     method: "POST",
//     endpoint: "/users",
//   })
//   .setDataMapper((data) => {
//     const formData = new FormData();
//     formData.append("key", data.name);
//     return formData;
//   });
//
// // ================>
//
// // OK
// getUsers.send({ queryParams: "" });
// getUsers.setQueryParams("").send();
// // Fail
// getUsers.send({ data: "" });
// getUsers.send({ params: "" });
// getUsers.setQueryParams("").send({ queryParams: "" });
//
// // ================>
//
// // OK
// getUser.send({ params: { id: "" }, queryParams: "" });
// getUser.setParams({ id: "" }).send({ queryParams: "" });
// // Fail
// getUser.send({ queryParams: "" });
// getUser.send();
// getUser.setParams({ id: "" }).send({ params: { id: "" } });
// getUser.setParams(null).send();
// getUser.send({ params: { id: null } }); // <----- Should fail
//
// // ================>
//
// // OK
// postUser.send({ data: { name: "" } });
// postUser.setData({ name: "" }).send();
// // Fail
// postUser.send({ queryParams: "" });
// postUser.send({ data: null }); // <------ Should fail
// postUser.setData(null).send();
// postUser.send();
// postUser.setData({ name: "" }).send({ data: { name: "" } });
//
// // ================>
//
// // OK
// patchUser.send({ params: { id: "" }, data: { name: "" } });
// patchUser.setParams({ id: "" }).setData({ name: "" }).send();
// // Fail
// patchUser.send({ queryParams: "" });
// patchUser.send({ data: null });
// patchUser.setData(null).send();
// patchUser.send();
// patchUser
//   .setParams({ id: "" })
//   .setData({ name: "" })
//   .send({ data: { name: "" } });
// patchUser
//   .setParams({ id: "" })
//   .setData({ name: "" })
//   .send({ params: { id: "" } });
//
// // ================>
//
// // OK
// mappedReq.send({ data: { name: "" } });
// mappedReq.setData({ name: "" }).send();
// // Fail
// mappedReq.send({ queryParams: "" });
// mappedReq.send({ data: undefined }); // <---- should fail
// mappedReq.setData(null).send();
// mappedReq.setData(null).send({ data: null, queryParams: () => null });
// mappedReq.send();
// mappedReq.send({ data: new FormData() });
// mappedReq.setData({ name: "" }).send({ data: { name: "" } });
