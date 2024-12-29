import {
  expectFunctionParametersType,
  expectNotFunctionParametersType,
  expectNotType,
  expectType,
} from "@hyper-fetch/testing";

import { Client } from "client";
import { ExtractLocalErrorType } from "types";

const client = new Client({
  url: "http://localhost:3000",
});

const getUsers = client.createRequest<{ response: { id: string }[]; queryParams?: string }>()({
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

describe("Request [Types]", () => {
  describe("when request does not require params and data", () => {
    it("should allow to make request with no parameters", () => {
      expectFunctionParametersType(getUsers.send).assert([
        {
          payload: null,
          params: null,
          queryParams: "",
        },
      ]);
    });
    it("should allow to make request with query params", () => {
      expectFunctionParametersType(getUsers.setQueryParams("").send).assert([
        {
          payload: null,
          params: null,
          queryParams: null,
        },
      ]);
    });
    it("should not allow to add data to request", () => {
      expectNotFunctionParametersType(getUsers.setQueryParams("").send).assert([
        {
          payload: { value: "test" },
          params: null,
          queryParams: null,
        },
      ]);
    });
    it("should not allow to add data to request", () => {
      expectNotFunctionParametersType(getUsers.setQueryParams("").send).assert([
        {
          payload: null,
          params: { id: "test" },
          queryParams: null,
        },
      ]);
    });
  });

  describe("when request does not require data and has required params", () => {
    it("should allow to make request with parameters", () => {
      expectFunctionParametersType(getUser.send).assert([
        {
          payload: null,
          params: { id: "test" },
          queryParams: undefined,
        },
      ]);

      expectFunctionParametersType(getUser.setParams({ id: "test" }).send).assert([
        {
          payload: null,
          params: null,
          queryParams: undefined,
        },
      ]);
    });
    it("should allow to make request with query params", () => {
      expectFunctionParametersType(getUser.send).assert([
        {
          payload: null,
          params: { id: "test" },
        },
      ]);

      expectFunctionParametersType(getUser.setParams({ id: "test" }).send).assert([
        {
          payload: null,
          params: null,
        },
      ]);
    });
    it("should not allow to add data to request", () => {
      expectNotFunctionParametersType(getUser.send).assert([
        {
          payload: { value: "test" },
          params: { id: "test" },
          queryParams: null,
        },
      ]);
    });
    it("should not allow to make request without params", () => {
      expectFunctionParametersType(getUser.send).assert([
        {
          payload: null,
          params: { id: "test" },
        },
      ]);
    });
    it("should not allow to make request with query params", () => {
      expectFunctionParametersType(getUser.setQueryParams).assert([undefined]);
    });
    it("should not allow to make request with incorrect params", () => {
      expectNotType<(options?: { payload: null; params: { id: null }; queryParams: null }) => Promise<any>>().assert(
        getUser.send,
      );
      expectNotType<(options?: { payload: null; params: null; queryParams: null }) => Promise<any>>().assert(
        getUser.send,
      );
    });
    it("should not allow to redeclare params", () => {
      expectNotType<(options?: { payload: null; params: { id: null }; queryParams: null }) => Promise<any>>().assert(
        getUser.setParams({ id: 1 }).send,
      );
    });
  });

  describe("when request does not require params and has required data", () => {
    it("should allow to make request with data", () => {
      expectFunctionParametersType(postUser.send).assert([
        {
          payload: { name: "Kacper" },
          params: null,
        },
      ]);
    });
    it("should allow to make request with query params", () => {
      expectFunctionParametersType(postUser.send).assert([
        {
          payload: { name: "Kacper" },
          params: null,
        },
      ]);

      expectFunctionParametersType(postUser.setPayload({ name: "Kacper" }).send).assert([
        {
          payload: null,
          params: null,
        },
      ]);
    });
    it("should not allow to add params to request", () => {
      expectNotFunctionParametersType(postUser.setPayload({ name: "Kacper" }).send).assert([
        {
          payload: null,
          params: { id: "test" },
        },
      ]);
    });
    it("should not allow to make request without data", () => {
      expectNotFunctionParametersType(postUser.send).assert([
        {
          payload: null,
          params: null,
        },
      ]);

      expectNotFunctionParametersType(postUser.send).assert([
        {
          payload: null,
        },
      ]);
    });
    it("should not allow to make request with incorrect data", () => {
      expectNotFunctionParametersType(postUser.send).assert([
        {
          payload: { something: "test" },
          params: null,
          queryParams: null,
        },
      ]);

      expectNotFunctionParametersType(postUser.send).assert([
        {
          payload: "test",
        },
      ]);
    });
    it("should not allow to redeclare data", () => {
      expectNotFunctionParametersType(postUser.setPayload({ name: "Kacper" }).send).assert([
        {
          payload: { name: "string" },
        },
      ]);
    });
  });

  describe("when request require data and params", () => {
    it("should allow to make request with parameters", () => {
      expectFunctionParametersType(patchUser.send).assert([
        {
          payload: {
            name: "Kacper",
          },
          params: { id: 1 },
        },
      ]);

      expectFunctionParametersType(patchUser.setParams({ id: 1 }).send).assert([
        {
          payload: {
            name: "Kacper",
          },
          params: null,
        },
      ]);
    });
    it("should allow to make request with query params", () => {
      expectFunctionParametersType(patchUser.send).assert([
        {
          payload: {
            name: "Kacper",
          },
          params: { id: 1 },
        },
      ]);

      expectFunctionParametersType(patchUser.setPayload({ name: "Kacper" }).setParams({ id: 1 }).send).assert([
        {
          payload: null,
          params: null,
        },
      ]);
    });
    it("should not allow to redeclare options", () => {
      expectNotFunctionParametersType(patchUser.setPayload({ name: "Kacper" }).setParams({ id: 1 }).send).assert([
        {
          payload: { name: "Maciej" },
          params: null,
          queryParams: null,
        },
      ]);
      expectNotFunctionParametersType(patchUser.setPayload({ name: "Kacper" }).setParams({ id: 1 }).send).assert([
        {
          payload: null,
          params: { id: 2 },
          queryParams: null,
        },
      ]);
    });
    it("should not allow to make request without values", () => {
      expectFunctionParametersType(patchUser.send).assert([
        {
          payload: { name: "Maciej" },
          params: { id: 1 },
        },
      ]);

      expectNotFunctionParametersType(patchUser.send).assert([
        {
          payload: null,
          params: null,
          queryParams: null,
        },
      ]);
    });

    it("should not allow to make request with incorrect params", () => {
      expectNotFunctionParametersType(patchUser.setPayload({ name: "Kacper" }).send).assert([
        {
          params: { error: "test" },
        },
      ]);

      expectNotFunctionParametersType(patchUser.setPayload({ name: "Kacper" }).send).assert([
        {
          params: null,
        },
      ]);
    });
  });
  it("should add correct error types", () => {
    expectType<Error>().assert<ExtractLocalErrorType<typeof getUser>>(new Error("message"));
    expectNotType<string>().assert<ExtractLocalErrorType<typeof getUser>>(new Error("message"));
  });
});

// // OK
// mappedReq.send({ payload: { name: "" } });
// mappedReq.setPayload({ name: "" }).send();
// // Fail
// mappedReq.send({ queryParams: "" });
// mappedReq.send({ payload: undefined });
// mappedReq.setPayload(null).send();
// mappedReq.setPayload(null).send({ payload: null, queryParams: () => null });
// mappedReq.send();
// mappedReq.send({ payload: new FormData() });
// mappedReq.setPayload({ name: "" }).send({ payload: { name: "" } });
