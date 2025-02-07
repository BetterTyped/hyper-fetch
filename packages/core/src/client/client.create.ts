import { TypeWithDefaults } from "types";
import { Client, ClientErrorType, ClientOptionsType } from "client";
import { AdapterInstance } from "adapter";

export type ClientGenericType = {
  error?: ClientErrorType;
  adapter?: AdapterInstance;
};

export function createClient<
  ClientProperties extends ClientGenericType = {
    error?: ClientErrorType;
    adapter?: AdapterInstance;
  },
>(
  options: ClientOptionsType<
    Client<
      NonNullable<TypeWithDefaults<ClientProperties, "error", ClientErrorType>>,
      NonNullable<TypeWithDefaults<ClientProperties, "adapter", AdapterInstance>>
    >
  >,
) {
  return new Client<
    NonNullable<TypeWithDefaults<ClientProperties, "error", ClientErrorType>>,
    NonNullable<TypeWithDefaults<ClientProperties, "adapter", AdapterInstance>>
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
//   .setPayloadMapper((data) => {
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
// postUser.setPayload({ name: "" }).send();
// // Fail
// postUser.send({ queryParams: "" });
// postUser.send({ data: null }); // <------ Should fail
// postUser.setPayload(null).send();
// postUser.send();
// postUser.setPayload({ name: "" }).send({ data: { name: "" } });
//
// // ================>
//
// // OK
// patchUser.send({ params: { id: "" }, data: { name: "" } });
// patchUser.setParams({ id: "" }).setPayload({ name: "" }).send();
// // Fail
// patchUser.send({ queryParams: "" });
// patchUser.send({ data: null });
// patchUser.setPayload(null).send();
// patchUser.send();
// patchUser
//   .setParams({ id: "" })
//   .setPayload({ name: "" })
//   .send({ data: { name: "" } });
// patchUser
//   .setParams({ id: "" })
//   .setPayload({ name: "" })
//   .send({ params: { id: "" } });
//
// // ================>
//
// // OK
// mappedReq.send({ data: { name: "" } });
// mappedReq.setPayload({ name: "" }).send();
// // Fail
// mappedReq.send({ queryParams: "" });
// mappedReq.send({ data: undefined }); // <---- should fail
// mappedReq.setPayload(null).send();
// mappedReq.setPayload(null).send({ data: null, queryParams: () => null });
// mappedReq.send();
// mappedReq.send({ data: new FormData() });
// mappedReq.setPayload({ name: "" }).send({ data: { name: "" } });
