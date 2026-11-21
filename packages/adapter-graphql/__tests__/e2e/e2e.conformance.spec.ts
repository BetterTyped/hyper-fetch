/**
 * @vitest-environment node
 */
import { Socket } from "@hyper-fetch/sockets";
import type { GraphQLFormattedError } from "graphql";
import { createClient } from "graphql-ws";

import { GraphqlSubscriptionError, GraphqlWsAdapter } from "../../src";
import type { ServerState } from "./e2e.graphql-ws-server";
import { createE2EGraphqlWsServer, createServerState } from "./e2e.graphql-ws-server";

/**
 * What a client observed of one subscription: every result in order and how it ended. Both clients are reduced to it,
 * so the adapter can be compared with the reference client of the protocol.
 */
type ResultType = { data: unknown; errors?: readonly GraphQLFormattedError[] };

type ObservedType = {
  results: ResultType[];
  end: "complete" | "stopped" | { errors: readonly GraphQLFormattedError[] };
};

type ScenarioType = {
  name: string;
  query: string;
  variables?: Record<string, unknown>;
  connectionParams?: Record<string, unknown>;
  /** Runs once the subscription is active on the server, e.g. publishes events */
  act?: (state: ServerState) => void;
  /** Stop after this many results - for subscriptions that never end on their own */
  take?: number;
};

const scenarios: ScenarioType[] = [
  {
    name: "events of the variables",
    query: "subscription OnMessage($room: String!) { onMessage(room: $room) { id text } }",
    variables: { room: "a" },
    act: (state) => {
      state.publish({ id: "1", room: "b", text: "other room" });
      state.publish({ id: "2", room: "a", text: "first" });
      state.publish({ id: "3", room: "a", text: "second" });
    },
    take: 2,
  },
  { name: "a completed subscription", query: "subscription { countdown(from: 3) }" },
  { name: "a subscription without events", query: "subscription { countdown(from: 0) }" },
  { name: "a validation error", query: "subscription { unknownField }" },
  { name: "missing variables", query: "subscription OnMessage($room: String!) { onMessage(room: $room) { id } }" },
  { name: "an execution error of an event", query: "subscription { failing }", take: 1 },
  { name: "connection params in the context", query: "subscription { whoAmI }", connectionParams: { token: "ann" } },
];

describe("Graphql Ws Adapter [ Conformance with graphql-ws ]", () => {
  let state: ServerState = createServerState();
  let server = createE2EGraphqlWsServer(state);
  let url = "";

  beforeEach(async () => {
    state = createServerState();
    server = createE2EGraphqlWsServer(state);
    url = await server.startServer();
  });

  afterEach(async () => {
    await server.stopServer();
  });

  /** Waits until the subscription runs on the server, then lets the scenario act */
  const actWhenActive = async (scenario: ScenarioType) => {
    if (!scenario.act) {
      return;
    }
    await vi.waitFor(() => expect(state.active("onMessage")).toHaveLength(1));
    scenario.act(state);
  };

  const observeWithGraphqlWs = async (scenario: ScenarioType): Promise<ObservedType> => {
    const client = createClient({ url, connectionParams: scenario.connectionParams, retryAttempts: 0 });
    const results: ResultType[] = [];
    try {
      return await new Promise<ObservedType>((resolve) => {
        const dispose = client.subscribe(
          { query: scenario.query, variables: scenario.variables },
          {
            next: (result) => {
              // Listeners always get `data` - `null` where the result of the reference client has none
              results.push(
                result.errors ? { data: result.data ?? null, errors: result.errors } : { data: result.data ?? null },
              );
              if (results.length === scenario.take) {
                dispose();
                resolve({ results, end: "stopped" });
              }
            },
            error: (errors) => resolve({ results, end: { errors: errors as GraphQLFormattedError[] } }),
            complete: () => resolve({ results, end: "complete" }),
          },
        );
        actWhenActive(scenario);
      });
    } finally {
      await client.dispose();
    }
  };

  const observeWithAdapter = async (scenario: ScenarioType): Promise<ObservedType> => {
    const socket = new Socket({
      url,
      adapter: GraphqlWsAdapter(),
      adapterOptions: { connectionParams: scenario.connectionParams },
    });
    const listener = socket.createListener<unknown, Record<string, unknown> | undefined>()({
      topic: scenario.query,
    });
    const results: ResultType[] = [];
    try {
      return await new Promise<ObservedType>((resolve) => {
        const stop = listener.setPayload(scenario.variables).listen(
          ({ data, extra }) => {
            // The reference client hands over the raw result - errors are left out when the server sent none
            results.push(extra.errors ? { data, errors: extra.errors } : { data });
            if (results.length === scenario.take) {
              stop();
              resolve({ results, end: "stopped" });
            }
          },
          {
            onEnd: ({ error }) => {
              if (error instanceof GraphqlSubscriptionError) {
                resolve({ results, end: { errors: error.errors } });
                return;
              }
              resolve({ results, end: "complete" });
            },
          },
        );
        actWhenActive(scenario);
      });
    } finally {
      await socket.disconnect();
    }
  };

  it.each(scenarios)("should observe the same as graphql-ws for $name", async (scenario) => {
    const reference = await observeWithGraphqlWs(scenario);
    state = createServerState();
    await server.stopServer();
    server = createE2EGraphqlWsServer(state);
    url = await server.startServer();

    const observed = await observeWithAdapter(scenario);

    expect(observed).toStrictEqual(reference);
  });

  it("should send the same handshake and subscription messages as graphql-ws", async () => {
    const received: { client: string; messages: unknown[] }[] = [];
    const record = (client: string) => {
      const entry = { client, messages: [] as unknown[] };
      received.push(entry);
      return entry.messages;
    };
    await server.stopServer();
    let current: unknown[] = [];
    server = createE2EGraphqlWsServer(state, {
      onConnect: (ctx) => {
        current.push({ type: "connection_init", payload: ctx.connectionParams });
        return true;
      },
      onSubscribe: (_, id, payload) => {
        current.push({ type: "subscribe", payload });
      },
      onComplete: () => {
        current.push({ type: "complete" });
      },
    });
    url = await server.startServer();
    const scenario: ScenarioType = {
      name: "handshake",
      query: "subscription OnMessage($room: String!) { onMessage(room: $room) { id text } }",
      variables: { room: "a" },
      connectionParams: { token: "ann" },
      act: (serverState) => serverState.publish({ id: "1", room: "a", text: "hi" }),
      take: 1,
    };

    current = record("graphql-ws");
    await observeWithGraphqlWs(scenario);
    await vi.waitFor(() => expect(current).toContainEqual({ type: "complete" }));
    current = record("adapter");
    await observeWithAdapter(scenario);
    await vi.waitFor(() => expect(current).toContainEqual({ type: "complete" }));

    const [reference, adapter] = received;
    // The adapter sends the operation name too, which the reference client leaves to the caller
    expect(adapter.messages).toStrictEqual([
      reference.messages[0],
      {
        type: "subscribe",
        payload: { ...(reference.messages[1] as { payload: object }).payload, operationName: "OnMessage" },
      },
      reference.messages[2],
    ]);
  });
});
