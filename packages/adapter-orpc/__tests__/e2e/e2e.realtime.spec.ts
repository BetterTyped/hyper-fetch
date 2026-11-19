/**
 * @vitest-environment node
 */
import { createSocketSdk, Socket } from "@hyper-fetch/sockets";
import { ORPCError } from "@orpc/client";

import type { OrpcSocketSchema } from "../../src/adapter";
import { OrpcSocketError } from "../../src/socket";
import { OrpcStreamAdapter } from "../../src/stream-adapter";
import { OrpcWebsocketAdapter } from "../../src/websocket-adapter";
import type { Planet, RealtimeRouter, RealtimeState } from "./e2e.orpc-realtime-server";
import { createRealtimeHttpServer, createRealtimeState, createRealtimeWsServer } from "./e2e.orpc-realtime-server";

/** Short enough to see restarts in a test, the default connection timeout still limits every attempt */
const reconnectTime = 200;

const transports = [
  {
    name: "OrpcStreamAdapter",
    createServer: createRealtimeHttpServer,
    createSocket: (url: string, { authorized }: { authorized: boolean }) =>
      new Socket({
        url,
        adapter: OrpcStreamAdapter(),
        reconnectTime,
        adapterOptions: authorized ? { headers: { authorization: "Bearer token" } } : {},
      }),
  },
  {
    name: "OrpcWebsocketAdapter",
    createServer: createRealtimeWsServer,
    createSocket: (url: string, { authorized }: { authorized: boolean }) =>
      new Socket({
        url,
        adapter: OrpcWebsocketAdapter(),
        reconnectTime,
        queryParams: authorized ? { token: "Bearer token" } : undefined,
      }),
  },
];

describe.each(transports)("Orpc Realtime [ E2E $name ]", ({ createServer, createSocket }) => {
  let state: RealtimeState = createRealtimeState();
  let server = createServer(state);
  let url = "";

  const createApi = ({ authorized = false } = {}) => {
    const socket = createSocket(url, { authorized });
    const errors: Error[] = [];
    socket.events.onError(({ error }) => {
      errors.push(error as Error);
    });
    const sdk = createSocketSdk<typeof socket, OrpcSocketSchema<RealtimeRouter>>(socket, {
      camelCaseToKebabCase: false,
    });
    sockets.push(socket);
    return { socket, sdk, errors };
  };
  const sockets: ReturnType<typeof createSocket>[] = [];

  const runsOf = (input: unknown) => state.runs.filter((run) => JSON.stringify(run.input) === JSON.stringify(input));

  beforeEach(async () => {
    state = createRealtimeState();
    server = createServer(state);
    url = await server.start();
  });

  afterEach(async () => {
    await Promise.all(sockets.map((socket) => socket.disconnect()));
    sockets.length = 0;
    await server.stop();
  });

  it("should deliver the events of the server with their ids", async () => {
    const { sdk, errors } = createApi();
    const callback = vi.fn();

    sdk.planet.onUpdate.$listener.setPayload({ id: 1 }).listen(({ data, extra }) => callback(data, extra.id));
    await vi.waitFor(() => expect(state.active()).toHaveLength(1));
    state.publish({ id: 1, name: "Earth" });
    state.publish({ id: 1, name: "Mars" });

    await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(2));
    expect(callback.mock.calls).toStrictEqual([
      [{ id: 1, name: "Earth" }, "1"],
      [{ id: 1, name: "Mars" }, "2"],
    ]);
    expect(errors).toStrictEqual([]);
  });

  it("should share one server subscription per input and keep the inputs apart", async () => {
    const { sdk } = createApi();
    const earth: Planet[] = [];
    const earthToo: Planet[] = [];
    const mars: Planet[] = [];

    sdk.planet.onUpdate.$listener.setPayload({ id: 1 }).listen(({ data }) => earth.push(data));
    sdk.planet.onUpdate.$listener.setPayload({ id: 1 }).listen(({ data }) => earthToo.push(data));
    sdk.planet.onUpdate.$listener.listen(({ data }) => mars.push(data), { payload: { id: 2 } });
    await vi.waitFor(() => expect(state.active()).toHaveLength(2));
    state.publish({ id: 1, name: "Earth" });
    state.publish({ id: 2, name: "Mars" });

    await vi.waitFor(() => expect(mars).toHaveLength(1));
    await vi.waitFor(() => expect(earthToo).toHaveLength(1));
    expect(earth).toStrictEqual([{ id: 1, name: "Earth" }]);
    expect(mars).toStrictEqual([{ id: 2, name: "Mars" }]);
    expect(runsOf({ id: 1 })).toHaveLength(1);
  });

  it("should keep a server subscription per input for one callback listening with two inputs", async () => {
    const { sdk } = createApi();
    const callback = vi.fn();

    const stopEarth = sdk.planet.onUpdate.$listener.listen(callback, { payload: { id: 1 } });
    sdk.planet.onUpdate.$listener.listen(callback, { payload: { id: 2 } });
    await vi.waitFor(() => expect(state.active()).toHaveLength(2));

    stopEarth();
    await vi.waitFor(() => expect(runsOf({ id: 1 })[0].finished).toBeTrue());
    expect(runsOf({ id: 2 })[0].finished).toBeFalse();
    state.publish({ id: 1, name: "Earth" });
    state.publish({ id: 2, name: "Mars" });

    await vi.waitFor(() => expect(callback).toHaveBeenCalledOnce());
    expect(callback).toHaveBeenCalledWith({ data: { id: 2, name: "Mars" }, extra: { id: "1", retry: undefined } });
    expect(state.runs).toHaveLength(2);
  });

  it("should stop the generator when the last listener unsubscribes", async () => {
    const { sdk } = createApi();
    const first = sdk.planet.onUpdate.$listener.setPayload({ id: 1 }).listen(() => {});
    const second = sdk.planet.onUpdate.$listener.setPayload({ id: 1 }).listen(() => {});
    await vi.waitFor(() => expect(state.active()).toHaveLength(1));

    first();
    // Publishing proves the stream still works for the second listener
    state.publish({ id: 1, name: "Earth" });
    expect(state.runs[0].finished).toBeFalse();

    second();
    await vi.waitFor(() => expect(state.runs[0].finished).toBeTrue());
    expect(state.runs).toHaveLength(1);
  });

  it("should resume with the last event id after a reconnect", async () => {
    const { sdk, socket } = createApi();
    const ids: (string | undefined)[] = [];
    sdk.planet.onUpdate.$listener.setPayload({ id: 1 }).listen(({ extra }) => ids.push(extra.id));
    await vi.waitFor(() => expect(state.active()).toHaveLength(1));
    state.publish({ id: 1, name: "Earth" });
    await vi.waitFor(() => expect(ids).toStrictEqual(["1"]));

    await socket.reconnect();

    await vi.waitFor(() => expect(state.active()).toHaveLength(1));
    await vi.waitFor(() => expect(state.runs[0].finished).toBeTrue());
    expect(state.runs.map((run) => run.lastEventId)).toStrictEqual([undefined, "1"]);
    state.publish({ id: 1, name: "Mars" });
    await vi.waitFor(() => expect(ids).toStrictEqual(["1", "2"]));
  });

  it("should start the subscriptions again after the connection dropped", async () => {
    const { sdk, errors } = createApi();
    const names: string[] = [];
    sdk.planet.onUpdate.$listener.setPayload({ id: 1 }).listen(({ data }) => names.push(data.name));
    await vi.waitFor(() => expect(state.active()).toHaveLength(1));
    state.publish({ id: 1, name: "Earth" });
    await vi.waitFor(() => expect(names).toHaveLength(1));

    server.dropConnections();

    await vi.waitFor(() => expect(state.runs).toHaveLength(2), { timeout: reconnectTime * 10 });
    await vi.waitFor(() => expect(state.active()).toHaveLength(1));
    expect(state.runs[1].lastEventId).toBe("1");
    expect(errors.length).toBeGreaterThan(0);
    state.publish({ id: 1, name: "Mars" });
    await vi.waitFor(() => expect(names).toStrictEqual(["Earth", "Mars"]));
  });

  it("should deliver every value of a finite iterator", async () => {
    const { sdk, errors } = createApi();
    const values: number[] = [];

    sdk.countdown.$listener.setPayload({ from: 3 }).listen(({ data }) => values.push(data.value));

    await vi.waitFor(() => expect(values).toStrictEqual([3, 2, 1]));
    expect(errors).toStrictEqual([]);
  });

  it("should start and end the listener of a finite iterator, and subscribe again with a new listen", async () => {
    const { sdk, socket, errors } = createApi();
    const log: unknown[] = [];
    const listener = sdk.countdown.$listener.setPayload({ from: 2 });
    const listenOnce = () =>
      listener.listen(({ data }) => log.push(data.value), {
        onStart: ({ topic }) => log.push(`start ${topic}`),
        onEnd: ({ error }) => log.push({ end: error }),
      });

    listenOnce();
    await vi.waitFor(() => expect(log).toHaveLength(4));
    expect(log).toStrictEqual(["start countdown", 2, 1, { end: null }]);
    expect(socket.adapter.listeners.get("countdown")?.size ?? 0).toBe(0);

    // A reconnect does not revive the ended subscription
    await socket.reconnect();
    expect(state.runs).toHaveLength(1);

    listenOnce();
    await vi.waitFor(() => expect(log).toHaveLength(8));
    expect(state.runs.map((run) => [run.lastEventId, run.finished])).toStrictEqual([
      [undefined, true],
      [undefined, true],
    ]);
    expect(errors).toStrictEqual([]);
  });

  it("should report the defined error of the iterator", async () => {
    const { sdk, errors } = createApi();
    const values: { celsius: number }[] = [];

    const onEnd = vi.fn();

    sdk.overheat.$listener.listen(({ data }) => values.push(data), { onEnd });

    await vi.waitFor(() => expect(errors).toHaveLength(1));
    expect(onEnd).toHaveBeenCalledExactlyOnceWith({ topic: "overheat", error: errors[0] });
    expect(values).toStrictEqual([{ celsius: 100 }]);
    expect(errors[0]).toBeInstanceOf(OrpcSocketError);
    const error = errors[0] as OrpcSocketError;
    expect(error.cause).toBeInstanceOf(ORPCError);
    expect(error).toMatchObject({ topic: "overheat", payload: undefined, defined: true, code: "OVERHEATED" });
    expect(error.shape).toStrictEqual({
      defined: true,
      code: "OVERHEATED",
      status: 500,
      message: "Too hot",
      data: { celsius: 900 },
    });
  });

  it("should report an input the server rejects", async () => {
    const { socket, errors } = createApi();
    const listener = socket.createListener<Planet, { id: string }>()({ topic: "planet/onUpdate" });

    listener.listen(() => {}, { payload: { id: "one" } });

    await vi.waitFor(() => expect(errors).toHaveLength(1));
    expect(errors[0]).toMatchObject({ topic: "planet/onUpdate", payload: { id: "one" }, code: "BAD_REQUEST" });
    expect(state.runs).toHaveLength(0);
  });

  it("should authorize the subscriptions with the connection options", async () => {
    const anonymous = createApi();
    anonymous.sdk.secret.$listener.listen(() => {});
    await vi.waitFor(() => expect(anonymous.errors).toHaveLength(1));
    expect(anonymous.errors[0]).toMatchObject({ name: "OrpcSocketError", topic: "secret", code: "UNAUTHORIZED" });

    const authorized = createApi({ authorized: true });
    const values: string[] = [];
    authorized.sdk.secret.$listener.listen(({ data }) => values.push(data));
    await vi.waitFor(() => expect(values).toStrictEqual(["classified"]));
    expect(authorized.errors).toStrictEqual([]);
  });

  it("should report a procedure that is not an event iterator", async () => {
    const { socket, errors } = createApi();

    socket
      .createListener<Planet, { id: number }>()({ topic: "planet/find" })
      .listen(() => {}, { payload: { id: 1 } });

    await vi.waitFor(() => expect(errors).toHaveLength(1));
    expect(errors[0]).toMatchObject({
      name: "OrpcSocketError",
      message: 'The procedure "planet/find" did not return an event iterator',
      topic: "planet/find",
      payload: { id: 1 },
      shape: null,
    });
  });

  it("should report a procedure that does not exist", async () => {
    const { socket, errors } = createApi();

    socket
      .createListener<number>()({ topic: "planet/missing" })
      .listen(() => {});

    await vi.waitFor(() => expect(errors).toHaveLength(1));
    expect(errors[0]).toMatchObject({ topic: "planet/missing", code: "NOT_FOUND", status: 404 });
  });

  it("should keep the special types of the input and the events", async () => {
    const { sdk } = createApi();
    const callback = vi.fn();

    sdk.types.$listener.setPayload({ since: new Date(0) }).listen(({ data }) => callback(data));

    await vi.waitFor(() => expect(callback).toHaveBeenCalledOnce());
    expect(callback).toHaveBeenCalledWith({
      since: new Date(0),
      total: 10n,
      scores: new Map([["a", 1]]),
      tags: new Set(["x"]),
    });
  });
});
