import { expectType } from "@hyper-fetch/testing";
import { Client, ExtractHasPayloadType, ExtractHasParamsType, ExtractHasQueryParamsType } from "@hyper-fetch/core";

import { UseFetchRequest } from "hooks/use-fetch";

const client = new Client({
  url: "http://localhost:3000",
});

describe("when using useFetch request", () => {
  it("should require params", () => {
    const getUser = client.createRequest<{ response: { id: string } }>()({
      method: "GET",
      endpoint: "/users/:id",
    });
    const getUserWithParams = getUser.setParams({ id: 1 });
    expectType<ExtractHasParamsType<UseFetchRequest<typeof getUser>>>().assert(false);
    expectType<ExtractHasParamsType<UseFetchRequest<typeof getUserWithParams>>>().assert(true);
  });
  it("should require payload", () => {
    const postUser = client.createRequest<{ response: { id: string }; payload: { name: string } }>()({
      method: "POST",
      endpoint: "/users",
    });
    const postUserWithPayload = postUser.setPayload({ name: "test" });

    expectType<ExtractHasPayloadType<UseFetchRequest<typeof postUser>>>().assert(false);
    expectType<ExtractHasPayloadType<UseFetchRequest<typeof postUserWithPayload>>>().assert(true);
  });
  it("should require params and payload", () => {
    const patchUser = client.createRequest<{
      response: { id: string };
      payload: { name: string };
      queryParams: { name: string };
    }>()({
      method: "PATCH",
      endpoint: "/users/:id",
    });
    const patchUserWithParams = patchUser.setParams({ id: 1 });
    const patchUserWithPayload = patchUser.setPayload({ name: "test" });
    const patchUserWithQueryParams = patchUser.setQueryParams({ name: "test" });

    expectType<false>().assert<ExtractHasParamsType<UseFetchRequest<typeof patchUser>>>(false);
    expectType<false>().assert<ExtractHasPayloadType<UseFetchRequest<typeof patchUser>>>(false);
    expectType<false>().assert<ExtractHasQueryParamsType<UseFetchRequest<typeof patchUser>>>(false);

    expectType<true>().assert<ExtractHasParamsType<UseFetchRequest<typeof patchUserWithParams>>>(true);
    expectType<true>().assert<ExtractHasPayloadType<UseFetchRequest<typeof patchUserWithPayload>>>(true);
    expectType<true>().assert<ExtractHasQueryParamsType<UseFetchRequest<typeof patchUserWithQueryParams>>>(true);
  });
});
