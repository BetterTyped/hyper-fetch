import { expectNotType, expectType } from "tsd";

import { Socket } from "socket";
import { ListenerCallbackType, SocketAdapterInstance } from "adapter";

const client = new Socket({
  url: "http://localhost:3000",
});

const getUsers = client.createListener<{ data: string }[]>()({
  endpoint: "/users",
});

const getUser = client.createListener<{ data: string }>()({
  endpoint: "/users/:id",
});

type TestCallbackType = ListenerCallbackType<
  SocketAdapterInstance,
  {
    data: string;
  }[]
>;

describe("when request does not require params and data", () => {
  it("should allow to make request with no parameters", () => {
    expectType<(options: { params: null; callback: TestCallbackType }) => void>(getUsers.listen);
  });
  it("should not allow to set params", () => {
    expectType<(options: null) => void>(getUsers.setParams);
  });
});

describe("when request does not require data and has required params", () => {
  it("should allow to make request with parameters", () => {
    expectType<(options?: { params: { id: string }; callback: any }) => void>(getUser.listen);
    expectType<(options?: { params: never; callback: any }) => void>(getUser.setParams({ id: 1 }).listen);
  });
  it("should allow to make request with query params", () => {
    expectType<(options?: { params: { id: string }; callback: any }) => void>(getUser.listen);
    expectType<(options?: { params: never; callback: any }) => void>(getUser.setParams({ id: 1 }).listen);
  });
  it("should not allow to add data to request", () => {
    expectNotType<(options?: { data: { value: string }; params: null; callback: any }) => void>(
      getUser.setParams({ id: 1 }).listen,
    );
  });
  it("should not allow to make request without params", () => {
    expectType<(options?: { params: { id: string }; callback: any }) => void>(getUser.listen);
    expectType<(options?: { params: { id: string }; callback: any }) => void>(getUser.listen);
  });
  it("should not allow to make request with incorrect params", () => {
    expectNotType<(options?: { params: { id: null }; callback: any }) => void>(getUser.listen);
    expectNotType<(options?: { params: null; callback: any }) => void>(getUser.listen);
  });
  it("should not allow to redeclare params", () => {
    expectNotType<(options?: { params: { id: null }; callback: any }) => void>(getUser.setParams({ id: 1 }).listen);
  });
});
