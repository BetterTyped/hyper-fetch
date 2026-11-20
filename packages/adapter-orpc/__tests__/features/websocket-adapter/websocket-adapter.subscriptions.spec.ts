import { flushPromises } from "../../utils/controlled-fetch";
import type { ControlledWebSocket } from "../../utils/controlled-websocket";
import { installControlledWebSocket } from "../../utils/controlled-websocket";
import { serialize } from "../../utils/stream-socket";
import { createWebsocketSocket } from "../../utils/websocket-socket";

const defaultPayload = { id: 1 };

describe("Orpc Websocket Adapter [ Subscriptions ]", () => {
  let Controlled = installControlledWebSocket();
  let setup = createWebsocketSocket();
  let ws: ControlledWebSocket;

  const subscribe = (payload: { id: number } = defaultPayload) => {
    const callback = vi.fn();
    const unsubscribe = setup.onUpdate.setPayload(payload).listen(({ data }) => callback(data));
    return { callback, unsubscribe };
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    Controlled = installControlledWebSocket();
    setup = createWebsocketSocket();
    await flushPromises();
    ws = Controlled.last;
    ws.serverOpen();
    await flushPromises();
  });

  afterEach(async () => {
    await setup.socket.disconnect();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("should send one request for listeners with the same payload", () => {
    const first = subscribe();
    const second = subscribe({ id: 1 });
    ws.serverStartIterator("1");

    ws.serverEvent("1", { data: serialize({ id: 1, name: "a" }) });

    expect(ws.requests).toHaveLength(1);
    expect(first.callback).toHaveBeenCalledExactlyOnceWith({ id: 1, name: "a" });
    expect(second.callback).toHaveBeenCalledExactlyOnceWith({ id: 1, name: "a" });
  });

  it("should keep the messages of different payloads apart", () => {
    const one = subscribe({ id: 1 });
    const two = subscribe({ id: 2 });

    ws.serverEvent("2", { data: serialize({ id: 2, name: "two" }) });
    ws.serverEvent("1", { data: serialize({ id: 1, name: "one" }) });

    expect(one.callback).toHaveBeenCalledExactlyOnceWith({ id: 1, name: "one" });
    expect(two.callback).toHaveBeenCalledExactlyOnceWith({ id: 2, name: "two" });
  });

  it("should abort the request when the last listener unsubscribes", () => {
    const first = subscribe();
    const second = subscribe();
    ws.serverStartIterator("1");

    first.unsubscribe();
    expect(ws.aborts).toStrictEqual([]);

    second.unsubscribe();
    ws.serverEvent("1", { data: serialize({ id: 1, name: "late" }) });

    expect(ws.messages.at(-1)).toStrictEqual({ i: "1", t: 4 });
    expect(second.callback).not.toHaveBeenCalled();
    expect(setup.errors).toStrictEqual([]);
  });

  it("should abort only the request of the payload that lost its listeners", () => {
    const one = subscribe({ id: 1 });
    subscribe({ id: 2 });

    one.unsubscribe();

    expect(ws.aborts).toStrictEqual(["1"]);
  });

  it("should send a new request without the last event id after every listener left", () => {
    const { unsubscribe } = subscribe();
    ws.serverEvent("1", { data: serialize({ id: 1, name: "a" }), meta: { id: "3" } });

    unsubscribe();
    subscribe();

    expect(ws.requests.map(({ i, p }) => [i, p?.h])).toStrictEqual([
      ["1", undefined],
      ["2", undefined],
    ]);
  });

  it("should start a new subscription without the last event id after the server ended one", () => {
    const first = subscribe();
    ws.serverEvent("1", { data: serialize({ id: 1, name: "a" }), meta: { id: "6" } });
    ws.serverEvent("1", { event: "done" });

    const second = subscribe();
    ws.serverEvent("2", { data: serialize({ id: 1, name: "b" }) });

    expect(ws.requests.map(({ i, p }) => [i, p?.h])).toStrictEqual([
      ["1", undefined],
      ["2", undefined],
    ]);
    expect(ws.aborts).toStrictEqual([]);
    expect(first.callback.mock.calls).toStrictEqual([[{ id: 1, name: "a" }]]);
    expect(second.callback).toHaveBeenCalledExactlyOnceWith({ id: 1, name: "b" });
  });

  it("should not deliver the rest of the messages after the last listener left in a callback", () => {
    const callback = vi.fn();
    const unsubscribe = setup.onUpdate.setPayload({ id: 1 }).listen(({ data }) => {
      callback(data);
      unsubscribe();
    });

    ws.serverEvent("1", { data: serialize({ id: 1, name: "a" }) });
    ws.serverEvent("1", { data: serialize({ id: 1, name: "b" }) });

    expect(callback).toHaveBeenCalledExactlyOnceWith({ id: 1, name: "a" });
    expect(ws.aborts).toStrictEqual(["1"]);
  });

  it("should keep two requests for one callback listening with two payloads", () => {
    const callback = vi.fn();
    const stopOne = setup.onUpdate.listen(callback, { payload: { id: 1 } });
    setup.onUpdate.listen(callback, { payload: { id: 2 } });

    stopOne();
    ws.serverEvent("1", { data: serialize({ id: 1, name: "one" }) });
    ws.serverEvent("2", { data: serialize({ id: 2, name: "two" }) });

    expect(ws.requests.map(({ p }) => p?.b)).toStrictEqual([{ json: { id: 1 } }, { json: { id: 2 } }]);
    expect(ws.aborts).toStrictEqual(["1"]);
    expect(callback).toHaveBeenCalledExactlyOnceWith({
      data: { id: 2, name: "two" },
      extra: { id: undefined, retry: undefined },
    });
  });

  it("should keep the request until every listen call of the same callback unsubscribed", () => {
    const callback = vi.fn();
    const first = setup.onUpdate.listen(callback, { payload: { id: 1 } });
    const second = setup.onUpdate.listen(callback, { payload: { id: 1 } });

    first();
    ws.serverEvent("1", { data: serialize({ id: 1, name: "a" }) });
    expect(ws.aborts).toStrictEqual([]);

    second();
    expect(ws.requests).toHaveLength(1);
    expect(ws.aborts).toStrictEqual(["1"]);
    expect(callback).toHaveBeenCalledOnce();
  });

  it("should report an abort that can't be sent", () => {
    const { unsubscribe } = subscribe();
    ws.readyState = ws.CLOSING;

    unsubscribe();
    ws.readyState = ws.OPEN;

    expect(setup.errors.map(({ message }) => message)).toStrictEqual([
      "[ControlledWebSocket] Cannot send - the connection is not open",
    ]);
    expect(setup.errors[0]).toMatchObject({ name: "OrpcSocketError", topic: "planet/onUpdate", payload: { id: 1 } });
  });
});
