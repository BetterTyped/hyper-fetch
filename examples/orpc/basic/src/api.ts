import { createClient, createSdk } from "@hyper-fetch/core";
import { OrpcAdapter, type OrpcSchema } from "@hyper-fetch/orpc";
import type { ContractRouterClient } from "@orpc/contract";

// Type-only import: the client depends on the contract, never on the server code.
import type { contract } from "../server/contract";

/** Points at the prefix of the `RPCHandler` in server/app.ts. */
export const client = createClient({
  url: `${window.location.origin}/api/rpc`,
}).setAdapter(OrpcAdapter());

/** Contract-first: the SDK is typed from the contract, so it works before the server is written. */
export const sdk = createSdk<typeof client, OrpcSchema<ContractRouterClient<typeof contract>>>(client, {
  // Keep procedure names as written in the contract.
  camelCaseToKebabCase: false,
});

// Every oRPC procedure has `$query` and `$mutation`, pick the one that matches how you use it.
export const listPlanets = sdk.planet.list.$query;
export const createPlanet = sdk.planet.create.$mutation;
