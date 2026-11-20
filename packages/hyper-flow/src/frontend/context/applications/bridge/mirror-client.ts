import type { AdapterInstance, ClientInstance } from "@hyper-fetch/core";
import { Adapter, Client } from "@hyper-fetch/core";
import { GraphqlAdapter } from "@hyper-fetch/graphql";

import type { Connection } from "@/store/applications/connection.store";

type MirrorClientOptions = Pick<Connection, "clientOptions" | "adapterOptions">;

/**
 * Adapters whose behaviour matters for presenting their requests (e.g. naming a GraphQL operation instead of printing
 * the whole document). Anything else is presented with a generic adapter built from the options the plugin reported.
 */
const knownAdapters: Record<string, () => AdapterInstance> = {
  graphql: () => GraphqlAdapter(),
};

const createMirrorAdapter = (adapterOptions: MirrorClientOptions["adapterOptions"]): AdapterInstance => {
  const name = adapterOptions?.name;
  const known = name ? knownAdapters[name] : undefined;
  if (known) {
    return known();
  }

  return new Adapter({
    name: name ?? "unknown",
    defaultMethod: adapterOptions?.defaultMethod ?? "GET",
    defaultExtra: adapterOptions?.defaultExtra ?? {},
    systemErrorStatus: adapterOptions?.systemErrorStatus ?? 0,
    systemErrorExtra: adapterOptions?.systemErrorExtra ?? {},
  });
};

/**
 * HyperFlow keeps one client per connected application that mirrors the events the plugin streams from the user's
 * client. It never sends requests, but it must present them the way the user's adapter does.
 */
export const createMirrorClient = ({ clientOptions, adapterOptions }: MirrorClientOptions): ClientInstance => {
  const client = new Client({ url: clientOptions?.url ?? "" });
  return client.setAdapter(createMirrorAdapter(adapterOptions));
};
