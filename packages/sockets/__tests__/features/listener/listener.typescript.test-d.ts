import { expectType } from "tsd";

import { Socket } from "socket";

const client = new Socket({
  url: "http://localhost:3000",
});

const listenForUsers = client.createListener<{ response: { data: string }[] }>()({
  topic: "/users",
});

const listenForUser = client.createListener<{ response: { data: string } }>()({
  topic: "/users/:id",
});

describe("when request does not require params", () => {
  it("should allow to make request with no parameters", () => {
    expectType<(callback: any, options: { params: null }) => void>(listenForUsers.listen);
  });
  it("should not allow to set params", () => {
    expectType<(options: null) => void>(listenForUsers.setParams);
  });
});

describe("when listener has required params", () => {
  it("should allow to add listener with parameters", () => {
    expectType<(callback: any, options: { params: { id: string } }) => void>(listenForUser.listen);
    expectType<(callback: any, options?: { params: never }) => void>(listenForUser.setParams({ id: 1 }).listen);
  });
});
