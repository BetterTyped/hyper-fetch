import { createHttpMockingServer } from "@hyper-fetch/testing";
import { waitFor } from "@testing-library/react";

import { client, createRequest, renderUseFetch } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useFetch [ Payload ]", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
    vi.restoreAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    client.clear();
  });

  // Adapters with their own serializers, like oRPC or tRPC with superjson, accept such payloads
  describe("when the payload holds a BigInt", () => {
    it("should fetch the data", async () => {
      const request = createRequest<{ id: number }, { total: bigint }>().setPayload({ total: 1n });
      mockRequest(request, { data: { id: 1 } });

      const view = renderUseFetch(request);

      await waitFor(() => expect(view.result.current.data).toStrictEqual({ id: 1 }));
    });

    it("should fetch again when the BigInt changes", async () => {
      const request = createRequest<{ id: number }, { total: bigint }>().setPayload({ total: 1n });
      mockRequest(request, { data: { id: 1 } });
      const spy = vi.spyOn(client.fetchDispatcher, "add");

      const view = renderUseFetch(request);
      await waitFor(() => expect(view.result.current.data).toStrictEqual({ id: 1 }));
      view.rerender({ request: request.setPayload({ total: 2n }) });

      await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
      expect(spy.mock.calls[1][0].payload).toStrictEqual({ total: 2n });
    });

    it("should not fetch again when the same BigInt is set again", async () => {
      const request = createRequest<{ id: number }, { total: bigint }>().setPayload({ total: 1n });
      mockRequest(request, { data: { id: 1 } });
      const spy = vi.spyOn(client.fetchDispatcher, "add");

      const view = renderUseFetch(request);
      await waitFor(() => expect(view.result.current.data).toStrictEqual({ id: 1 }));
      view.rerender({ request: request.setPayload({ total: 1n }) });

      expect(spy).toHaveBeenCalledOnce();
    });

    it("should tell a BigInt apart from the same digits in a string", async () => {
      const request = createRequest<{ id: number }, { total: bigint | string }>().setPayload({ total: 1n });
      mockRequest(request, { data: { id: 1 } });
      const spy = vi.spyOn(client.fetchDispatcher, "add");

      const view = renderUseFetch(request);
      await waitFor(() => expect(view.result.current.data).toStrictEqual({ id: 1 }));
      view.rerender({ request: request.setPayload({ total: "1" }) });

      await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
    });
  });
});
