import { expectNotType, expectType } from "tsd";

import { Client } from "client";

const client = new Client({
  url: "http://localhost:3000",
});

const getUsers = client.createRequest<{ id: string }[]>()({
  method: "GET",
  endpoint: "/users",
});

const getUser = client.createRequest<{ id: string }>()({
  method: "GET",
  endpoint: "/users/:id",
});

// const postUser = client.createRequest<{ id: string }, { name: string }>()({
//   method: "POST",
//   endpoint: "/users",
// });

// const patchUser = client.createRequest<{ id: string }, { name: string }>()({
//   method: "PATCH",
//   endpoint: "/users/:id",
// });

// const mappedReq = client
//   .createRequest<{ id: string }, { name: string }>()({
//     method: "POST",
//     endpoint: "/users",
//   })
//   .setDataMapper((data) => {
//     const formData = new FormData();
//     formData.append("key", data.name);
//     return formData;
//   });

describe("when request does not require params and data", () => {
  it("should allow to make request with no parameters", () => {
    expectType<(options?: { data: null; params: null; queryParams: string }) => Promise<any>>(getUsers.send);
  });
  it("should allow to make request with query params", () => {
    expectType<(options?: { data: null; params: null; queryParams: null }) => Promise<any>>(
      getUsers.setQueryParams("").send,
    );
  });
  it("should not allow to add data to request", () => {
    expectNotType<(options?: { data: { value: string }; params: null; queryParams: null }) => Promise<any>>(
      getUsers.setQueryParams("").send,
    );
  });
  it("should not allow to add data to request", () => {
    expectNotType<(options?: { data: null; params: { userId: string }; queryParams: null }) => Promise<any>>(
      getUsers.setQueryParams("").send,
    );
  });
});

describe("when request does not require data and has required params", () => {
  it("should allow to make request with parameters", () => {
    expectType<(options?: { data: null; params: { id: string }; queryParams: string }) => Promise<any>>(getUser.send);
    expectType<(options?: { data: null; params: null; queryParams: string }) => Promise<any>>(
      getUser.setParams({ id: 1 }).send,
    );
  });
  it("should allow to make request with query params", () => {
    expectType<(options?: { data: null; params: { id: string }; queryParams: null }) => Promise<any>>(
      getUser.setQueryParams("").send,
    );
    expectType<(options?: { data: null; params: null; queryParams: null }) => Promise<any>>(
      getUser.setParams({ id: 1 }).setQueryParams("").send,
    );
  });
  it("should not allow to add data to request", () => {
    expectNotType<(options?: { data: { value: string }; params: null; queryParams: null }) => Promise<any>>(
      getUser.setQueryParams("").setParams({ id: 1 }).send,
    );
  });
  it("should not allow to make request without params", () => {
    expectType<(options?: { data: null; params: { id: string }; queryParams: null }) => Promise<any>>(
      getUser.setQueryParams("").send,
    );
    expectType<(options?: { data: null; params: { id: string }; queryParams: null }) => Promise<any>>(getUser.send);
  });
  it("should not allow to make request with incorrect params", () => {
    expectNotType<(options?: { data: null; params: { id: null }; queryParams: null }) => Promise<any>>(getUser.send);
    expectNotType<(options?: { data: null; params: null; queryParams: null }) => Promise<any>>(getUser.send);
  });
  it("should not allow to redeclare params", () => {
    expectNotType<(options?: { data: null; params: { id: null }; queryParams: null }) => Promise<any>>(
      getUser.setParams({ id: 1 }).send,
    );
  });
});

//
// // ================>
//
// // OK
// postUser.send({ data: { name: "" } });
// postUser.setData({ name: "" }).send();
// // Fail
// postUser.send({ queryParams: "" });
// postUser.send({ data: null });
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
// mappedReq.send({ data: undefined });
// mappedReq.setData(null).send();
// mappedReq.setData(null).send({ data: null, queryParams: () => null });
// mappedReq.send();
// mappedReq.send({ data: new FormData() });
// mappedReq.setData({ name: "" }).send({ data: { name: "" } });
