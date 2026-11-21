import { createClient, createSdk } from "@hyper-fetch/core";
import { OrpcAdapter, OrpcStreamAdapter, type OrpcSchema, type OrpcSocketSchema } from "@hyper-fetch/orpc";
import { createSocketSdk, Socket } from "@hyper-fetch/sockets";

// Type-only import: the router code never reaches the browser bundle.
import type { router } from "../server/router";

/** Both talk to the same `RPCHandler`, mounted in server/app.ts. */
const url = `${window.location.origin}/api/rpc`;

/** Regular procedures: one request, one response. */
export const client = createClient({ url }).setAdapter(OrpcAdapter());
export const sdk = createSdk<typeof client, OrpcSchema<typeof router>>(client, {
  camelCaseToKebabCase: false,
});

/** Event iterator procedures: the adapter opens one HTTP event stream per subscription. */
export const socket = new Socket({ url, adapter: OrpcStreamAdapter() });
export const realtime = createSocketSdk<typeof socket, OrpcSocketSchema<typeof router>>(socket, {
  camelCaseToKebabCase: false,
});

export const startJob = sdk.job.start.$mutation;
export const onProgress = realtime.job.onProgress.$listener;
