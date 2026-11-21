# GraphQL subscriptions in depth

Read this when working with `GraphqlWsAdapter` beyond the basics in `SKILL.md`: connection options, the lifecycle,
errors, close codes, lazy connections and keep-alive.

## Protocol

`GraphqlWsAdapter` speaks `graphql-transport-ws`, the protocol of the `graphql-ws` library, and asks for that
subprotocol. It implements the protocol itself, `graphql-ws` is not a dependency.

| Step                 | Client                                           | Server                                  |
| -------------------- | ------------------------------------------------ | --------------------------------------- |
| Open                 | WebSocket with subprotocol `graphql-transport-ws` |                                         |
| Handshake            | `connection_init` with `connectionParams`        | `connection_ack` - the socket is ready  |
| Subscribe            | `subscribe { id, payload: { query, operationName, variables } }` | `next` events          |
| Stop                 | `complete { id }`                                | -                                       |
| Server end           | -                                                | `complete { id }` or `error { id }`     |
| Keep-alive           | answers `ping` with `pong`, pings with `keepAlive` | answers `ping` with `pong`            |

- Ids are strings and never reused, so a late message of a stopped subscription can't reach a new one.
- A message before `connection_ack` other than `ping`/`pong`, or one that breaks the protocol, closes the connection
  with `4004` and is reported to `socket.onError`. The checks are those of the `graphql-ws` client.

## Adapter options

Passed as `adapterOptions` to the `Socket`, changeable per attempt with `socket.onConnect`.

| Option             | Type                                       | Default | Meaning                                                    |
| ------------------ | ------------------------------------------ | ------- | ---------------------------------------------------------- |
| `autoConnect`      | `boolean`                                  | `true`  | Connect on creation. Ignored with `lazy`.                  |
| `lazy`             | `boolean`                                  | `false` | Connect on the first subscription, close after the last.   |
| `lazyCloseTimeout` | `number`                                   | `0`     | With `lazy`, ms the connection stays after the last one.   |
| `connectionParams` | `object \| () => object \| Promise<object>` | -       | `connection_init` payload. A function runs every attempt. |
| `keepAlive`        | `{ enabled, intervalMs?, pongTimeoutMs? }` | off     | Defaults `10000` and `5000` ms when enabled.               |
| `WebSocket`        | `typeof WebSocket`                         | global  | e.g. `ws` in Node.js before 22.                            |

Listener options: `document?: string | DocumentNode`. Without it the `topic` is sent as the document.

Socket options that matter: `connectionTimeout` (covers the handshake up to `connection_ack`), `reconnect`,
`reconnectTime`, `maxReconnectTime`, `minUptime`, `reconnectDelay`, `shouldReconnect`. They are the shared reconnection
engine of `@hyper-fetch/sockets`.

## Typed listeners

```ts
const onMessage = socket.createListener()({ topic: "OnMessage", options: { document: OnMessageDocument } });

onMessage.listen(({ data }) => data.onMessage.text, { payload: { room: "a" } });
// @ts-expect-error the variables are required by the document
onMessage.listen(() => {});
```

- `createListener<Response, Payload>()` generics win over the document.
- A document without variables (`{ [key: string]: never }`) needs no payload.
- `delivery: { strategy: "batch", interval }` delivers arrays of the document's data.
- An untyped `gql` document leaves the data `unknown`: pass the generics.

## Lifecycle

```ts
onMessage.setPayload({ room: "a" }).listen(callback, {
  onStart: ({ topic }) => {}, // sent over an acknowledged connection, again after every reconnect
  onEnd: ({ topic, error }) => {}, // server `complete` (error null) or `error` (GraphqlSubscriptionError)
});
```

- The protocol has no start confirmation, so a subscription counts as started once it is sent over an acknowledged
  connection.
- A listener joining a running subscription gets `onStart` at once.
- On the end, pending `delivery` events are delivered first, then the listener unsubscribes and `onEnd` runs.
- An ended subscription is not restarted by a reconnect. A new `listen()` starts a fresh one.
- Unsubscribing yourself does not call `onEnd`.

`useListener` maps it to `status`: `"idle"`, `"starting"`, `"listening"`, `"ended"`, `"failed"` with `error`.

## Errors

| What happened                                    | How it arrives                                                 |
| ------------------------------------------------ | -------------------------------------------------------------- |
| An event resolved in part                        | `extra.errors` next to the partial `data`, subscription goes on |
| The request can't run (e.g. missing variables)   | one event with `data: null` and `extra.errors`, then `complete` |
| Validation or source failure (`error` message)   | `onEnd` with `GraphqlSubscriptionError`, and `socket.onError`  |
| Protocol violation by the server                 | close `4004`, `socket.onError`, no reconnect                   |
| `connectionParams` throws or rejects             | close `4005`, `socket.onError`, no reconnect                   |
| Connection closed by the server                  | `socket.onError` with the code and reason, then the close rules |
| A listener callback throws                       | `socket.onError`; other listeners still get the event          |

`GraphqlSubscriptionError` has `errors: GraphQLFormattedError[]`, `topic` and `payload` (the variables). Its `message`
joins the error messages.

## Close codes

| Code                                      | Reconnects |
| ----------------------------------------- | ---------- |
| `1000`                                    | no         |
| `1001`, `1005`, `1006`, `1012`, `1013`, `1014` | yes   |
| other `1001`-`1999`, e.g. `1002`, `1011`  | no         |
| `4004`, `4005`, `4400`, `4401`, `4406`, `4409`, `4429`, `4500` | no |
| `4403`, `4408`, `4504`, `4499`, anything else | yes    |

`shouldReconnectGraphqlWs(loss)` implements this table. The socket's `shouldReconnect` replaces it entirely, so call it
from yours:

```ts
shouldReconnect: (loss) => loss.code === 4401 || shouldReconnectGraphqlWs(loss),
```

A refused loss is not retried, but the socket still reconnects when the app goes back online, and `socket.connect()`
or `socket.reconnect()` work.

## Lazy connections

- No connection until a listener starts. `autoConnect` is ignored.
- The last subscription to stop (or to be ended by the server) closes the connection with 1000, after
  `lazyCloseTimeout`. A subscription started in that time reuses the connection.
- While the engine reconnects after a loss, new subscriptions wait for it - they don't skip the backoff.
- After `socket.disconnect()` or a refused close, new subscriptions do not reopen it - call `socket.connect()`.

## Keep-alive

The server's `ping` is always answered. `keepAlive: { enabled: true }` makes the client ping after `intervalMs` without
any message and treat the connection as lost when no `pong` arrives within `pongTimeoutMs`. WebSocket-level ping frames
of servers (`useServer(..., keepAlive)` of `graphql-ws`) are answered by the runtime.

## Not supported

- `subscriptions-transport-ws` (subprotocol `graphql-ws`), the deprecated Apollo protocol.
- Queries and mutations over the WebSocket - use the `GraphqlAdapter`. `emit()` throws.
- Merging of incremental delivery (`@defer` / `@stream`) results - each `next` payload is delivered as it arrives.
