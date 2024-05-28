import { expectNotType, expectType } from "tsd";

import { Client } from "@hyper-fetch/core";
import { UseFetchRequest, useFetch } from "hooks/use-fetch";

const client = new Client({
  url: "http://localhost:3000",
});

const patchUser = client.createRequest<{ response: { id: string }; payload: { name: string } }>()({
  method: "PATCH",
  endpoint: "/users",
});

const c = useFetch(patchUser);

const a = (b: UseFetchRequest<typeof patchUser>) => b;

a(patchUser);
