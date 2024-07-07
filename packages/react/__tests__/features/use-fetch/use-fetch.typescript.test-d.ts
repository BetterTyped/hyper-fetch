import { expectNotType, expectType } from "tsd";
import { Client, ExtractHasDataType, ExtractHasParamsType } from "@hyper-fetch/core";

import { UseFetchRequest } from "hooks/use-fetch";

const client = new Client({
  url: "http://localhost:3000",
});

const getUser = client.createRequest<{ id: string }>()({
  method: "GET",
  endpoint: "/users/:id",
});

const patchUser = client.createRequest<{ id: string }, { name: string }>()({
  method: "POST",
  endpoint: "/users/:id",
});

const postUser = client.createRequest<{ id: string }, { name: string }>()({
  method: "POST",
  endpoint: "/users",
});

describe("when using useFetch request", () => {
  it("should require params", () => {
    expectType<true>({} as unknown as ExtractHasParamsType<UseFetchRequest<typeof getUser>>);
    expectNotType<false>({} as unknown as ExtractHasParamsType<UseFetchRequest<typeof getUser>>);
    expectType<false>({} as unknown as ExtractHasDataType<UseFetchRequest<typeof getUser>>);
    expectNotType<true>({} as unknown as ExtractHasDataType<UseFetchRequest<typeof getUser>>);
  });
  it("should require data", () => {
    expectType<false>({} as unknown as ExtractHasParamsType<UseFetchRequest<typeof postUser>>);
    expectNotType<true>({} as unknown as ExtractHasParamsType<UseFetchRequest<typeof postUser>>);
    expectType<true>({} as unknown as ExtractHasDataType<UseFetchRequest<typeof postUser>>);
    expectNotType<false>({} as unknown as ExtractHasDataType<UseFetchRequest<typeof postUser>>);
  });
  it("should require params and data", () => {
    expectType<true>({} as unknown as ExtractHasParamsType<UseFetchRequest<typeof patchUser>>);
    expectNotType<false>({} as unknown as ExtractHasParamsType<UseFetchRequest<typeof patchUser>>);
    expectType<true>({} as unknown as ExtractHasDataType<UseFetchRequest<typeof patchUser>>);
    expectNotType<false>({} as unknown as ExtractHasDataType<UseFetchRequest<typeof patchUser>>);
  });
});
