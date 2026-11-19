import { getAdapterHeaders, getAdapterPayload } from "adapter";
import { Client } from "client";
import { Plugin } from "plugin";

import { createControlledClient, flushPromises } from "../../utils/controlled-adapter.utils";

describe("Adapter [ Mapping ]", () => {
  const client = new Client({ url: "http://mapping" });
  const createRequest = () =>
    client.createRequest<{ payload: any; response: any }>()({ endpoint: "/mapping", method: "POST" });

  describe("When mapping the headers", () => {
    it("should give no headers for a request without a payload", () => {
      expect(getAdapterHeaders(createRequest())).toEqual({});
    });

    it.each([
      ["an object", { name: "John" }],
      ["an array", [1, 2, 3]],
      ["an empty object", {}],
    ])("should add the JSON content type for %s", (_, payload) => {
      expect(getAdapterHeaders(createRequest().setPayload(payload))).toEqual({ "Content-Type": "application/json" });
    });

    it.each([
      ["a string", "text"],
      ["a number", 5],
      ["a boolean", true],
    ])("should not add the content type for %s", (_, payload) => {
      expect(getAdapterHeaders(createRequest().setPayload(payload))).toEqual({});
    });

    it.each([
      ["FormData", () => new FormData()],
      ["Blob", () => new Blob(["content"], { type: "text/plain" })],
      ["ArrayBuffer", () => new ArrayBuffer(4)],
      ["Uint8Array", () => new Uint8Array([1, 2])],
      ["DataView", () => new DataView(new ArrayBuffer(4))],
      ["URLSearchParams", () => new URLSearchParams({ a: "1" })],
      ["ReadableStream", () => new ReadableStream()],
    ])("should leave the content type of %s to the transport", (_, createPayload) => {
      expect(getAdapterHeaders(createRequest().setPayload(createPayload()))).toEqual({});
    });

    it("should keep the headers of the request", () => {
      const request = createRequest().setHeaders({ Authorization: "Bearer token", "X-Custom": "1" });

      expect(getAdapterHeaders(request)).toEqual({ Authorization: "Bearer token", "X-Custom": "1" });
    });

    it("should read the Headers instance", () => {
      const request = createRequest()
        .setHeaders(new Headers({ Authorization: "Bearer token" }))
        .setPayload({ a: 1 });

      expect(getAdapterHeaders(request)).toEqual({
        authorization: "Bearer token",
        "Content-Type": "application/json",
      });
    });

    it("should read the list of pairs", () => {
      const request = createRequest().setHeaders([
        ["Authorization", "Bearer token"],
        ["X-Custom", "1"],
      ]);

      expect(getAdapterHeaders(request)).toEqual({ Authorization: "Bearer token", "X-Custom": "1" });
    });

    it.each(["Content-Type", "content-type", "CONTENT-TYPE", "Content-type"])(
      "should not add the default content type next to the %s header",
      (name) => {
        const request = createRequest()
          .setHeaders({ [name]: "text/plain" })
          .setPayload({ a: 1 });

        expect(getAdapterHeaders(request)).toEqual({ [name]: "text/plain" });
      },
    );

    it("should drop the headers with empty values", () => {
      const headers = { "X-Null": null, "X-Undefined": undefined, "X-Empty": "", "X-Kept": "1" };
      const request = createRequest().setHeaders(headers as unknown as HeadersInit);

      expect(getAdapterHeaders(request)).toEqual({ "X-Empty": "", "X-Kept": "1" });
    });

    it("should let an empty content type remove the default one", () => {
      const request = createRequest()
        .setHeaders({ "Content-Type": undefined } as unknown as HeadersInit)
        .setPayload({ a: 1 });

      expect(getAdapterHeaders(request)).toEqual({});
    });

    it("should not change the headers of the request", () => {
      const headers = { "X-Custom": "1" };
      const request = createRequest().setHeaders(headers).setPayload({ a: 1 });

      getAdapterHeaders(request);

      expect(headers).toEqual({ "X-Custom": "1" });
      expect(request.headers).toBe(headers);
    });
  });

  describe("When mapping the payload", () => {
    it.each([
      ["an object", { name: "John" }, '{"name":"John"}'],
      ["an array", [1, 2], "[1,2]"],
      ["a string", "text", '"text"'],
      ["a number", 0, "0"],
      ["a boolean", false, "false"],
      ["null", null, "null"],
      ["a date", new Date(0), '"1970-01-01T00:00:00.000Z"'],
    ])("should stringify %s", (_, payload, expected) => {
      expect(getAdapterPayload(payload)).toBe(expected);
    });

    it.each([
      ["FormData", () => new FormData()],
      ["Blob", () => new Blob(["content"])],
      ["ArrayBuffer", () => new ArrayBuffer(4)],
      ["Uint8Array", () => new Uint8Array([1, 2])],
      ["DataView", () => new DataView(new ArrayBuffer(4))],
      ["URLSearchParams", () => new URLSearchParams({ a: "1" })],
      ["ReadableStream", () => new ReadableStream()],
    ])("should pass %s through untouched", (_, createPayload) => {
      const payload = createPayload();

      expect(getAdapterPayload(payload)).toBe(payload);
    });

    it("should give nothing for a payload which can't be stringified", () => {
      const circular: Record<string, unknown> = {};
      circular.self = circular;

      expect(getAdapterPayload(circular)).toBe("");
      // oxlint-disable-next-line unicorn/no-useless-undefined
      expect(getAdapterPayload(undefined)).toBeUndefined();
    });
  });

  describe("When the code around the adapter throws", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const setup = () => {
      const controlled = createControlledClient();
      const request = controlled.client.createRequest<{ response: any; error: any }>()({
        endpoint: "/throwing",
        method: "POST",
      });
      return { ...controlled, request };
    };

    const answer = async (
      calls: ReturnType<typeof setup>["calls"],
      sent: Promise<{ success: boolean; error: any; data: any }>,
      outcome: "succeed" | "fail",
    ) => {
      await flushPromises();
      await calls[0][outcome]();
      return sent;
    };

    it.each([
      ["onResponse", "succeed"],
      ["onSuccess", "succeed"],
      ["onResponse", "fail"],
      ["onError", "fail"],
    ] as const)("should give an error response when the %s interceptor throws", async (interceptor, outcome) => {
      const { client: controlledClient, calls, request } = setup();
      controlledClient[interceptor](() => {
        throw new Error("Broken interceptor");
      });

      const response = await answer(calls, request.send(), outcome);

      expect(response.success).toBe(false);
      expect(response.data).toBeNull();
      expect(response.error.message).toBe("Broken interceptor");
    });

    it.each(["succeed", "fail"] as const)(
      "should settle the request when a plugin throws after the request did %s",
      async (outcome) => {
        const { client: controlledClient, calls, request } = setup();
        controlledClient.addPlugin(
          new Plugin({ name: "broken" }).onRequestFinished(() => {
            throw new Error("Broken plugin");
          }),
        );

        const response = await answer(calls, request.send(), outcome);

        expect(response).toBeDefined();
        expect(controlledClient.submitDispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
      },
    );

    it("should give an error response when the request interceptor throws", async () => {
      const { client: controlledClient, calls, request } = setup();
      controlledClient.onRequest(() => {
        throw new Error("Broken interceptor");
      });

      const response = await request.send();

      expect(response.success).toBe(false);
      expect(response.error.message).toBe("Broken interceptor");
      expect(calls).toHaveLength(0);
    });

    it("should give an error response when the fetcher throws", async () => {
      const { client: controlledClient, request } = setup();
      controlledClient.adapter.setFetcher(() => {
        throw new Error("Broken fetcher");
      });

      const response = await request.send();

      expect(response.success).toBe(false);
      expect(response.status).toBe(0);
      expect(response.error.message).toBe("Broken fetcher");
    });

    it("should give an error response when the adapter has no fetcher", async () => {
      const { client: controlledClient, request } = setup();
      controlledClient.adapter.unstable_fetcher = undefined as never;

      const response = await request.send();

      expect(response.success).toBe(false);
      expect(response.error.message).toBe("Request processing error");
    });

    it("should leave the dispatcher clean after the failures", async () => {
      const { client: controlledClient, calls, request } = setup();
      controlledClient.onResponse(() => {
        throw new Error("Broken interceptor");
      });

      await answer(calls, request.send(), "succeed");

      expect(controlledClient.submitDispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
      expect(controlledClient.submitDispatcher.getAllRunningRequests()).toHaveLength(0);
      expect(controlledClient.requestManager.abortControllers.size).toBe(0);
    });
  });
});
