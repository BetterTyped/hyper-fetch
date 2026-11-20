import { AppManager } from "@hyper-fetch/core";

import { OrpcStreamAdapter } from "../../../src/stream-adapter";
import { ControlledStreamCall, createControlledFetch, flushPromises } from "../../utils/controlled-fetch";
import { createStreamSocket, serialize } from "../../utils/stream-socket";

describe("Orpc Stream Adapter [ Environment ]", () => {
  let server = createControlledFetch();
  let setup = createStreamSocket();

  const recreate = async (options: Parameters<typeof createStreamSocket>[0]) => {
    await setup.socket.disconnect();
    setup = createStreamSocket(options);
    await flushPromises();
  };

  const advance = async (ms: number) => {
    vi.advanceTimersByTime(ms);
    await flushPromises();
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    server = createControlledFetch();
    setup = createStreamSocket();
    await flushPromises();
  });

  afterEach(async () => {
    await setup.socket.disconnect();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("when the server answers slowly", () => {
    it("should wait the connection timeout, not the reconnect time, for the response", async () => {
      await recreate({ reconnectTime: 100, connectionTimeout: 10_000 });
      const onStart = vi.fn();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, onStart });
      await flushPromises();

      await advance(5000);
      server.last().open();
      await flushPromises();

      expect(server.calls).toHaveLength(1);
      expect(server.last().aborted).toBeFalse();
      expect(onStart).toHaveBeenCalledOnce();
      expect(setup.errors).toStrictEqual([]);
    });

    it("should give up on the response after the connection timeout and wait the reconnect time to start again", async () => {
      await recreate({ reconnectTime: 10_000, connectionTimeout: 100 });
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 } });
      await flushPromises();

      await advance(100);
      expect(server.calls[0].aborted).toBeTrue();
      expect(setup.errors.map(({ message }) => message)).toStrictEqual([
        'The stream of "planet/onUpdate" did not open in 100ms',
      ]);

      await advance(9999);
      expect(server.calls).toHaveLength(1);
      await advance(1);
      expect(server.calls).toHaveLength(2);
    });
  });

  describe("when choosing fetch", () => {
    it("should use the fetch of the adapter options", async () => {
      const calls: ControlledStreamCall[] = [];
      const customFetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const call = new ControlledStreamCall(String(input), init ?? {});
        calls.push(call);
        return call.response;
      });
      await recreate({ adapterOptions: { fetch: customFetch } });
      const callback = vi.fn();

      setup.onUpdate.listen(({ data }) => callback(data), { payload: { id: 1 } });
      await flushPromises();
      calls[0].open();
      calls[0].send({ data: serialize({ id: 1, name: "custom" }) });
      await flushPromises();

      expect(customFetch).toHaveBeenCalledOnce();
      expect(server.calls).toHaveLength(0);
      expect(callback).toHaveBeenCalledExactlyOnceWith({ id: 1, name: "custom" });
    });

    it("should report a runtime without fetch", async () => {
      await setup.socket.disconnect();
      vi.stubGlobal("fetch", null);
      setup = createStreamSocket();
      await flushPromises();

      expect(setup.socket.adapter.connected).toBeFalse();
      expect(setup.socket.adapter.connecting).toBeFalse();
      expect(setup.errors.map(({ message }) => message)).toStrictEqual(["fetch is not available in this environment"]);
    });
  });

  describe("when the socket is destroyed", () => {
    it("should leave no online subscription and start nothing when the app goes online", async () => {
      const appManager = new AppManager();
      const before = appManager.emitter.listenerCount("online");
      await recreate({ appManager });
      expect(appManager.emitter.listenerCount("online")).toBe(before + 1);
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 } });
      await flushPromises();
      server.last().fail();
      await flushPromises();

      await setup.socket.destroy();
      appManager.setOnline(false);
      appManager.setOnline(true);
      await advance(60_000);

      expect(appManager.emitter.listenerCount("online")).toBe(before);
      expect(server.calls).toHaveLength(1);
      expect(setup.socket.adapter.connected).toBeFalse();
    });

    it("should stop the streams of the previous socket when the adapter is used by another one", async () => {
      const adapter = OrpcStreamAdapter();
      await recreate({ adapter });
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 } });
      await flushPromises();
      const running = server.last();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 2 } });
      await flushPromises();
      server.last().fail();
      await flushPromises();

      setup = createStreamSocket({ adapter });
      await advance(60_000);

      expect(running.aborted).toBeTrue();
      expect(server.calls).toHaveLength(2);
    });
  });

  describe("when intercepting messages", () => {
    it("should pass the topic and the event meta of the subscription to onMessage", async () => {
      const interceptor = vi.fn(({ event }: { event: unknown }) => event);
      setup.socket.onMessage(interceptor);
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 } });
      await flushPromises();
      server.last().open();

      server.last().send({ data: serialize({ id: 1, name: "a" }), id: "7", retry: 300 });
      await flushPromises();

      expect(interceptor).toHaveBeenCalledExactlyOnceWith({
        event: { id: 1, name: "a" },
        topic: "planet/onUpdate",
        extra: { id: "7", retry: 300 },
      });
    });
  });
});
