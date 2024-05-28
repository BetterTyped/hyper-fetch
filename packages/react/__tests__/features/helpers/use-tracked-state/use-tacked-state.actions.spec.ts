import { act, waitFor } from "@testing-library/react";

import { startServer, resetInterceptors, stopServer } from "../../../server";
import { createRequest, renderUseTrackedState } from "../../../utils";

describe("useTrackedState [ Actions ]", () => {
  let request = createRequest();

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    request = createRequest();
  });

  describe("when updating the local state", () => {
    it("should allow to set data", async () => {
      const value = { test: 1 };
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setData(value, false);
      });

      expect(result.current[0].data).toBe(value);
    });
    it("should allow to set error", async () => {
      const value = { test: 1 };
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setError(value as unknown as Error, false);
      });

      expect(result.current[0].error).toBe(value);
    });
    it("should allow to set loading", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setLoading(true, false);
      });

      expect(result.current[0].loading).toBeTrue();
    });
    it("should allow to set status", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setStatus(900, false);
      });

      expect(result.current[0].status).toBe(900);
    });
    it("should allow to set success", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setSuccess(false, false);
      });

      await waitFor(() => {
        expect(result.current[0].success).toBe(false);
      });
    });
    it("should allow to set extra", async () => {
      const extra = { headers: { test: "1" } };
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setExtra(extra, false);
      });

      await waitFor(() => {
        expect(result.current[0].extra).toBe(extra);
      });
    });
    it("should allow to set timestamp", async () => {
      const value = new Date();
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setTimestamp(value, false);
      });

      expect(result.current[0].timestamp).toBe(value);
    });
    it("should allow to set retries", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setRetries(999, false);
      });

      expect(result.current[0].retries).toBe(999);
    });
  });
  describe("when updating the cache state", () => {
    it("should allow to set data", async () => {
      const spy = jest.spyOn(request.client.cache, "set");
      const value = { test: 1 };
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setData(value, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
    it("should allow to set error", async () => {
      const spy = jest.spyOn(request.client.cache, "set");
      const value = { test: 1 };
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setError(value as unknown as Error, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
    it("should allow to set loading", async () => {
      const spy = jest.spyOn(request.client.requestManager.events, "emitLoading");
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setLoading(true, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
    it("should allow to set status", async () => {
      const spy = jest.spyOn(request.client.cache, "set");
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setStatus(900, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
    it("should allow to set success", async () => {
      const spy = jest.spyOn(request.client.cache, "set");
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setSuccess(false, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
    it("should allow to set extra", async () => {
      const extra = { headers: { test: "1" } };
      const spy = jest.spyOn(request.client.cache, "set");
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setExtra(extra, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
    it("should allow to set timestamp", async () => {
      const spy = jest.spyOn(request.client.cache, "set");
      const value = new Date();
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setTimestamp(value, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
    it("should allow to set retries", async () => {
      const spy = jest.spyOn(request.client.cache, "set");
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setRetries(999, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
  });
});
