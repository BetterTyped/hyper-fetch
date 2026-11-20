# 0001 - One reconnection engine for every socket adapter

- Status: proposed
- Date: 2026-11-20
- Area: `packages/sockets`, every package with a socket adapter (`adapter-trpc`, `adapter-orpc`, `adapter-graphql`)

## Context

The connection lifecycle of a socket adapter - opening attempts, the connection timeout, reconnecting after a loss,
joining concurrent `connect()` calls, ignoring stale transports, manual versus automatic closing and the online
listener - is written inline in every connector. It exists five times: `WebsocketAdapter`, `ServerSentEventsAdapter`,
`TrpcWebsocketAdapter`, the oRPC WebSocket adapter and the oRPC stream adapter. A `graphql-ws` adapter would be the
sixth copy.

The copies share their gaps. Two are proven by failing specs in `adapter.websocket.reconnection.spec.ts`:

1. A socket connected by hand with `autoConnect: false` never recovers after a network drop. The scheduled attempt is
   skipped while offline, and the online listener only connects when `autoConnect` is set.
2. A connection that drops right after every open (a server that accepts and then closes with 4401) retries forever
   at a fixed delay, whatever `reconnect` says, because every open resets the attempt counter.

Read from the code:

- The delay before the next attempt is fixed (`reconnectTime`, 5 s). No backoff, no jitter - every client of a
  restarted server comes back at the same moment.
- Attempts skipped while offline count towards `reconnect`.
- A server close with 1000 is never retried, although servers, proxies and load balancers close with 1000 on deploys
  and idle timeouts.
- Nothing reacts to the tab becoming visible again. A connection lost in the background waits for the full delay.
- No hook decides which close codes are fatal. A protocol with "do not retry" codes (graphql-ws 4400, 4401, 4406,
  4409, 4429) can't express them.

`reconnecting-websocket` is the usual reference, and it is not one to copy: it has no per-attempt jitter, wedges
`reconnect()` after `close()` or exhausted retries through a stuck lock (issue #165), crashes Node.js when a
connecting socket is closed (#197), and is unmaintained. We compared it with `partysocket`, the `graphql-ws` client,
Socket.IO, Phoenix, Centrifuge, SignalR, Ably and the AWS "Exponential Backoff And Jitter" article.

## Decision

Add one reconnection engine to `@hyper-fetch/sockets` and build every adapter on it. An adapter describes its
transport - how to open it, when it is ready, how to read a close - and the engine owns the lifecycle.

### What the engine owns

- **Attempts and generations.** Every attempt gets a generation token. Events of an older generation are ignored, so a
  replaced or closed transport can't change the state (Phoenix `connectClock`, Centrifuge `_transportId`). Concurrent
  `connect()` calls join the attempt in progress.
- **Ready, not open.** An attempt succeeds when the adapter reports the connection ready: on `open` for WebSocket and
  SSE, on the handshake acknowledgement for protocols that have one (`graphql-ws` `connection_ack`). The connection
  timeout (`connectionTimeout`) covers the whole way to ready.
- **Backoff with full jitter.** The delay before attempt `n` (from 0) is
  `min + random(0, min(max - min, min * 2 ** n))`, with `min = reconnectTime` and `max = maxReconnectTime`, and the
  exponent capped so it never overflows. This is the AWS "Full Jitter" with a floor, as in Centrifuge.
- **Retry policy escape hatch.** `reconnectDelay({ attempt, elapsed, reason })` returns the delay in ms, or `null` to
  stop, replacing the default (SignalR `IRetryPolicy`).
- **Stable connections reset the counter.** The attempt counter resets only after the connection stays ready for
  `minUptime`. A connection that drops sooner keeps backing off and counts towards `reconnect`.
- **Which closes are retried.** `shouldReconnect({ code, reason, error })` decides. The default retries every close
  the client did not start, 1000 included (Phoenix, `reconnecting-websocket`). Adapters pass their protocol's fatal
  codes as their default, the user option wins over it.
- **Network.** Going offline drops the transport and pauses: no attempts run and none are counted. Coming back online
  cancels the pending delay and connects at once, also aborting an attempt opened while offline (Centrifuge, Ably).
- **Visibility.** When the app gets the focus back and the socket should be connected but is not, the pending delay
  is skipped and it connects at once (Phoenix). Attempts still run in the background - background notifications need
  them.
- **What "should be connected" means.** After the first `connect()` - automatic with `autoConnect` or called by hand -
  and until `disconnect()`. `autoConnect` only decides the first connection, recovery never depends on it.
- **Cleanup.** `disconnect()` cancels every timer and attempt. `dispose()` also removes the app manager listeners.

The network and focus signals come from the core app manager, so React Native and other environments keep their own
event sources.

### What stays in the adapters

Creating the transport, the protocol handshake, encoding and decoding frames, heartbeats, subscriptions and
resubscribing after a reconnect, and the protocol's fatal close codes.

### Options

On the socket, next to the existing `reconnect` (attempt limit), `reconnectTime`, and `connectionTimeout`:

| Option | Default | Meaning |
| --- | --- | --- |
| `reconnectTime` | 1000 | Minimum delay before an attempt (was the fixed delay, 5000) |
| `maxReconnectTime` | 30000 | Maximum delay before an attempt |
| `minUptime` | 5000 | Time a connection stays ready before the attempt counter resets |
| `reconnectDelay` | full jitter | `({ attempt, elapsed, reason }) => number \| null` |
| `shouldReconnect` | retry all but client closes | `({ code, reason, error }) => boolean` |

## Consequences

- One implementation to test hard, instead of five copies to keep in sync. The engine gets its own specs and a seeded
  randomized spec that checks the invariants (one live transport, no timers after `disconnect()`, paired connect and
  disconnect events, `reconnect()` always starts an attempt while online) over thousands of event sequences.
- Reconnect timing changes for every socket user: the first retry comes after 1-2 s instead of 5 s, later ones back
  off to 30 s, a server close with 1000 is retried, offline drops the connection right away, and a lost connection
  comes back as soon as the tab is focused again. No API is removed and the new options are optional, but the
  defaults change behavior, so the release type (minor or major) is decided when it ships - v10 is already out.
- `reconnect: 3` now bounds connections that open and fail right away, which used to retry forever.
- Not part of this decision: buffering emits while disconnected, liveness detection beyond the WebSocket heartbeat,
  and a `suspended` state for long outages. They can build on the engine later.
