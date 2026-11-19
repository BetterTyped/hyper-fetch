/**
 * Checked in a program of its own by `pnpm typecheck`. Inside the whole test program, types resolved earlier by other
 * files hide how deep these instantiations go - a client with a custom adapter used to exceed the instantiation depth
 * of tsgo in `createRequest()()` only when checked on its own.
 */
import { Adapter } from "adapter";
import { createClient } from "client";
import { HttpMethods } from "constants/http.constants";

const adapter = new Adapter({
  name: "custom-adapter",
  defaultMethod: HttpMethods.GET,
  defaultExtra: {},
  systemErrorStatus: 0,
  systemErrorExtra: {},
});

const client = createClient({ url: "https://api.test.com" }).setAdapter(adapter);

export const request = client.createRequest()({ endpoint: "test" });
