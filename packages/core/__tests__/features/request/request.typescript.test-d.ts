import { expectNotType, expectType } from "tsd";

import { Client } from "client";

const client = new Client({
  url: "http://localhost:3000",
});

const getUsers = client.createRequest<{ response: { id: string }[] }>()({
  method: "GET",
  endpoint: "/users",
});

const getUser = client.createRequest<{ response: { id: string } }>()({
  method: "GET",
  endpoint: "/users/:id",
});

const postUser = client.createRequest<{ response: { id: string }; payload: { name: string } }>()({
  method: "POST",
  endpoint: "/users",
});

const patchUser = client.createRequest<{ response: { id: string }; payload: { name: string } }>()({
  method: "PATCH",
  endpoint: "/users/:id",
});

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

describe("when request does not require params and has required data", () => {
  it("should allow to make request with data", () => {
    expectType<(options?: { data: { name: string }; params: null; queryParams: string }) => Promise<any>>(
      postUser.send,
    );
    expectType<(options?: { data: null; params: null; queryParams: string }) => Promise<any>>(
      postUser.setData({ name: "Kacper" }).send,
    );
  });
  it("should allow to make request with query params", () => {
    expectType<(options?: { data: { name: string }; params: null; queryParams: null }) => Promise<any>>(
      postUser.setQueryParams("").send,
    );
    expectType<(options?: { data: null; params: null; queryParams: null }) => Promise<any>>(
      postUser.setData({ name: "Kacper" }).setQueryParams("").send,
    );
  });
  it("should not allow to add params to request", () => {
    expectNotType<(options?: { data: any; params: { id: string }; queryParams: null }) => Promise<any>>(
      postUser.setQueryParams("").setData({ name: "Kacper" }).send,
    );
  });
  it("should not allow to make request without data", () => {
    expectType<(options?: { data: null; params: null; queryParams: null }) => Promise<any>>(
      postUser.setQueryParams("").send,
    );
    expectType<(options?: { data: null; params: null; queryParams: null }) => Promise<any>>(postUser.send);
  });
  it("should not allow to make request with incorrect data", () => {
    expectNotType<(options?: { data: { something: string }; params: null; queryParams: null }) => Promise<any>>(
      postUser.send,
    );
    expectNotType<(options?: { data: string; params: null; queryParams: null }) => Promise<any>>(postUser.send);
  });
  it("should not allow to redeclare data", () => {
    expectNotType<(options?: { data: { name: string }; params: null; queryParams: null }) => Promise<any>>(
      postUser.setData({ name: "Kacper" }).send,
    );
  });
});

describe("when request require data and params", () => {
  it("should allow to make request with parameters", () => {
    expectType<(options?: { data: { name: string }; params: { id: string }; queryParams: string }) => Promise<any>>(
      patchUser.send,
    );
    expectType<(options?: { data: null; params: null; queryParams: string }) => Promise<any>>(
      patchUser.setParams({ id: 1 }).send,
    );
  });
  it("should allow to make request with query params", () => {
    expectType<(options?: { data: { name: string }; params: { id: string }; queryParams: null }) => Promise<any>>(
      patchUser.setQueryParams("").send,
    );
    expectType<(options?: { data: null; params: null; queryParams: null }) => Promise<any>>(
      patchUser.setData({ name: "Kacper" }).setParams({ id: 1 }).setQueryParams("").send,
    );
  });
  it("should not allow to redeclare options", () => {
    expectNotType<(options?: { data: { name: string }; params: { id: string }; queryParams: null }) => Promise<any>>(
      patchUser.setQueryParams("").setData({ name: "Kacper" }).setParams({ id: 1 }).send,
    );
  });
  it("should not allow to make request without values", () => {
    expectType<(options?: { data: { name: string }; params: { id: string }; queryParams: null }) => Promise<any>>(
      patchUser.setQueryParams("").send,
    );
    expectType<(options?: { data: { name: string }; params: { id: string }; queryParams: null }) => Promise<any>>(
      patchUser.send,
    );
  });
  it("should not allow to make request with incorrect params", () => {
    expectNotType<(options?: { data: { name: number }; params: { id: null }; queryParams: null }) => Promise<any>>(
      patchUser.send,
    );
    expectNotType<(options?: { data: null; params: null; queryParams: null }) => Promise<any>>(patchUser.send);
  });
});

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
