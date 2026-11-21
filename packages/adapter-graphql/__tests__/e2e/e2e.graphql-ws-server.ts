import { buildSchema } from "graphql";
import type { ServerOptions } from "graphql-ws";
// Not a React hook - named after the library, imported under another name for the hooks lint rule
import { useServer as attachGraphqlWsServer } from "graphql-ws/use/ws";
import type { AddressInfo } from "net";
import { WebSocketServer } from "ws";

export type Message = { id: string; room: string; text: string };

/** Subscriptions of the schema, the way a production server would have them */
export const typeDefs = /* GraphQL */ `
  type Message {
    id: ID!
    room: String!
    text: String!
    author: String
  }

  type Query {
    ok: Boolean
  }

  type Subscription {
    onMessage(room: String!): Message!
    countdown(from: Int!): Int!
    whoAmI: String
    failing: Int
  }
`;

type ActiveSubscriptionType = { field: string; args: Record<string, unknown>; finished: boolean };

/**
 * What the server saw - the tests publish events and read the subscriptions and connections from it.
 */
export const createServerState = () => {
  const listeners = new Set<(message: Message) => void>();
  const subscriptions: ActiveSubscriptionType[] = [];
  const connectionParams: (Record<string, unknown> | undefined)[] = [];

  /** An async iterator over the published messages of a room - stopped when the client completes */
  const onMessage = (room: string) => {
    const subscription: ActiveSubscriptionType = { field: "onMessage", args: { room }, finished: false };
    subscriptions.push(subscription);
    const queue: Message[] = [];
    let wake: (() => void) | null = null;
    const listener = (message: Message) => {
      if (message.room === room) {
        queue.push(message);
        wake?.();
      }
    };
    listeners.add(listener);

    const waitForMessage = () =>
      new Promise<void>((resolve) => {
        wake = () => {
          wake = null;
          resolve();
        };
      });

    const finish = () => {
      subscription.finished = true;
      listeners.delete(listener);
      wake?.();
    };

    return {
      [Symbol.asyncIterator]() {
        return this;
      },
      async next(): Promise<IteratorResult<{ onMessage: Message }>> {
        while (queue.length === 0 && !subscription.finished) {
          // eslint-disable-next-line no-await-in-loop
          await waitForMessage();
        }
        const message = queue.shift();
        if (!message) {
          return { done: true, value: undefined };
        }
        return { done: false, value: { onMessage: message } };
      },
      async return(): Promise<IteratorResult<{ onMessage: Message }>> {
        finish();
        return { done: true, value: undefined };
      },
    };
  };

  return {
    subscriptions,
    connectionParams,
    onMessage,
    publish: (message: Message) => listeners.forEach((listener) => listener(message)),
    active: (field: string) =>
      subscriptions.filter((subscription) => subscription.field === field && !subscription.finished),
  };
};

export type ServerState = ReturnType<typeof createServerState>;

/** The root value of the schema - `subscribe` resolvers return async iterables, graphql-js runs them */
const createRootValue = (state: ServerState) => ({
  onMessage: ({ room }: { room: string }) => state.onMessage(room),
  countdown: async function* countdown({ from }: { from: number }) {
    for (let value = from; value > 0; value -= 1) {
      yield { countdown: value };
    }
  },
  whoAmI: async function* whoAmI(_: unknown, context: { connectionParams?: Record<string, unknown> }) {
    yield { whoAmI: String(context.connectionParams?.token ?? "anonymous") };
  },
  failing: async function* failing() {
    // The field resolver of every event fails - the server sends the errors with a `next`
    yield {
      get failing() {
        throw new Error("Could not resolve the event");
      },
    };
  },
});

/**
 * A real `graphql-ws` server on a random port. `options` reach `useServer`, e.g. `onConnect` to reject a token.
 */
export const createE2EGraphqlWsServer = (
  state: ServerState,
  options: Partial<ServerOptions<Record<string, unknown>>> = {},
  { keepAlive = 0 }: { keepAlive?: number } = {},
) => {
  const schema = buildSchema(typeDefs);
  let server: WebSocketServer | null = null;
  let dispose: (() => void | Promise<void>) | null = null;

  const startServer = async (port = 0): Promise<string> => {
    server = new WebSocketServer({ port, path: "/graphql" });
    await new Promise<void>((resolve) => {
      server?.once("listening", () => resolve());
    });
    const { onConnect, ...serverOptions } = options;
    const disposable = attachGraphqlWsServer(
      {
        schema,
        roots: { subscription: createRootValue(state) },
        context: (ctx) => ({ connectionParams: ctx.connectionParams }),
        ...serverOptions,
        onConnect: (ctx) => {
          state.connectionParams.push(ctx.connectionParams);
          return onConnect ? onConnect(ctx) : true;
        },
      },
      server,
      keepAlive,
    );
    dispose = () => disposable.dispose();
    return `ws://localhost:${(server.address() as AddressInfo).port}/graphql`;
  };

  /** Closes every client connection with the code, keeping the server up - like a restart behind a balancer */
  const dropConnections = (code = 1012, reason = "Service Restart") => {
    server?.clients.forEach((client) => client.close(code, reason));
  };

  const stopServer = async () => {
    server?.clients.forEach((client) => client.terminate());
    await dispose?.();
    await new Promise<void>((resolve) => {
      if (!server) {
        resolve();
        return;
      }
      server.close(() => resolve());
    });
    server = null;
    dispose = null;
  };

  return {
    startServer,
    stopServer,
    dropConnections,
    get clients() {
      return server?.clients.size ?? 0;
    },
  };
};
