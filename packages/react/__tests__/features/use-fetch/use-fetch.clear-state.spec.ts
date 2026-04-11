import { act, waitFor } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { client, createRequest, renderUseFetch } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useFetch [ clearState ]", () => {
  let request = createRequest();

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    vi.resetModules();
    request = createRequest();
    client.clear();
  });

  describe("when clearState is called", () => {
    it("should reset all state fields to initial values after successful fetch", async () => {
      const mock = mockRequest(request, { data: { name: "test" } });
      const view = renderUseFetch(request);

      await waitFor(() => {
        expect(view.result.current.data).toStrictEqual(mock);
        expect(view.result.current.success).toBeTrue();
      });

      act(() => {
        view.result.current.clearState();
      });

      await waitFor(() => {
        expect(view.result.current.data).toBeNull();
        expect(view.result.current.error).toBeNull();
        expect(view.result.current.status).toBeNull();
        expect(view.result.current.success).toBeFalse();
        expect(view.result.current.loading).toBeFalse();
        expect(view.result.current.retries).toBe(0);
        expect(view.result.current.responseTimestamp).toBeNull();
        expect(view.result.current.requestTimestamp).toBeNull();
      });
    });

    it("should reset all state fields after error response", async () => {
      mockRequest(request, { status: 400 });
      const view = renderUseFetch(request);

      await waitFor(() => {
        expect(view.result.current.error).toBeDefined();
        expect(view.result.current.success).toBeFalse();
      });

      act(() => {
        view.result.current.clearState();
      });

      await waitFor(() => {
        expect(view.result.current.data).toBeNull();
        expect(view.result.current.error).toBeNull();
        expect(view.result.current.status).toBeNull();
        expect(view.result.current.success).toBeFalse();
        expect(view.result.current.loading).toBeFalse();
      });
    });

    it("should be a callable function", () => {
      const view = renderUseFetch(request);
      expect(view.result.current.clearState).toBeFunction();
    });
  });
});
