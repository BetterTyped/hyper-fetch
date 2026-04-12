import { act, waitFor } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { testSuccessState, testErrorState } from "../../shared";
import { client, createRequest, renderUseSubmit } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useSubmit [ Optimistic ]", () => {
  let request = createRequest({ method: "POST" });

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
    request = createRequest({ method: "POST" });
    client.clear();
  });

  // ============================
  // Happy paths
  // ============================

  describe("happy path", () => {
    it("should call optimistic callback before sending request and pass mutationContext to onSubmitSuccess", async () => {
      const optimisticSpy = vi.fn(() => ({
        context: { snapshot: "old-data" },
      }));
      const successSpy = vi.fn();

      const optimisticRequest = request.setOptimistic(optimisticSpy);
      const mock = mockRequest(optimisticRequest);
      const response = renderUseSubmit(optimisticRequest);

      act(() => {
        response.result.current.onSubmitSuccess(successSpy);
        response.result.current.submit();
      });

      await testSuccessState(mock, response);
      expect(optimisticSpy).toHaveBeenCalledTimes(1);
      expect(successSpy).toHaveBeenCalledTimes(1);
      expect(successSpy.mock.calls[0][0].mutationContext).toStrictEqual({ snapshot: "old-data" });
    });

    it("should invalidate listed requests on success", async () => {
      const listRequest = client.createRequest()({ endpoint: "/list" });
      const invalidateSpy = vi.spyOn(client.cache, "invalidate");

      const optimisticRequest = request.setOptimistic(() => ({
        context: { done: true },
        invalidate: [listRequest],
      }));

      const mock = mockRequest(optimisticRequest);
      const response = renderUseSubmit(optimisticRequest);

      act(() => {
        response.result.current.submit();
      });

      await testSuccessState(mock, response);
      expect(invalidateSpy).toHaveBeenCalledWith(listRequest);
      invalidateSpy.mockRestore();
    });

    it("should pass mutationContext to onSubmitFinished on success", async () => {
      const finishedSpy = vi.fn();
      const optimisticRequest = request.setOptimistic(() => ({
        context: { prevValue: 42 },
      }));

      const mock = mockRequest(optimisticRequest);
      const response = renderUseSubmit(optimisticRequest);

      act(() => {
        response.result.current.onSubmitFinished(finishedSpy);
        response.result.current.submit();
      });

      await testSuccessState(mock, response);
      expect(finishedSpy).toHaveBeenCalledTimes(1);
      expect(finishedSpy.mock.calls[0][0].mutationContext).toStrictEqual({ prevValue: 42 });
    });
  });

  // ============================
  // Failure / rollback
  // ============================

  describe("failure / rollback", () => {
    it("should call rollback on network error and pass mutationContext to onSubmitError", async () => {
      const rollbackSpy = vi.fn();
      const errorSpy = vi.fn();
      const optimisticRequest = request.setOptimistic(() => ({
        context: { snapshot: "before" },
        rollback: rollbackSpy,
      }));

      const mock = mockRequest(optimisticRequest, { status: 400 });
      const response = renderUseSubmit(optimisticRequest);

      act(() => {
        response.result.current.onSubmitError(errorSpy);
        response.result.current.submit();
      });

      await testErrorState(mock, response);
      expect(rollbackSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][0].mutationContext).toStrictEqual({ snapshot: "before" });
    });

    it("should still fire onSubmitError when rollback throws", async () => {
      const errorSpy = vi.fn();
      const optimisticRequest = request.setOptimistic(() => ({
        context: { val: true },
        rollback: () => {
          throw new Error("Rollback failed");
        },
      }));

      const mock = mockRequest(optimisticRequest, { status: 400 });
      const response = renderUseSubmit(optimisticRequest);

      act(() => {
        response.result.current.onSubmitError(errorSpy);
        response.result.current.submit();
      });

      await testErrorState(mock, response);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][0].mutationContext).toStrictEqual({ val: true });
    });
  });

  // ============================
  // Async optimistic callback
  // ============================

  describe("async optimistic callback", () => {
    it("should wait for async optimistic callback before sending request", async () => {
      const callOrder: string[] = [];

      const optimisticRequest = request.setOptimistic(async () => {
        callOrder.push("optimistic");
        await new Promise<void>((r) => {
          setTimeout(r, 50);
        });
        return { context: { async: true } };
      });

      const mock = mockRequest(optimisticRequest);
      const successSpy = vi.fn(() => {
        callOrder.push("success");
      });
      const response = renderUseSubmit(optimisticRequest);

      act(() => {
        response.result.current.onSubmitSuccess(successSpy);
        response.result.current.submit();
      });

      await testSuccessState(mock, response);
      expect(callOrder).toStrictEqual(["optimistic", "success"]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((successSpy.mock.calls as any)[0][0]?.mutationContext).toStrictEqual({ async: true });
    });

    it("should not send request when async optimistic callback rejects", async () => {
      const addSpy = vi.spyOn(client.submitDispatcher, "add");

      const optimisticRequest = request.setOptimistic(async () => {
        throw new Error("Async onMutate failed");
      });

      const response = renderUseSubmit(optimisticRequest);

      let submitResult: any;
      await act(async () => {
        submitResult = await response.result.current.submit();
      });

      expect(submitResult.error).toBeDefined();
      expect(submitResult.data).toBeNull();
      expect(addSpy).not.toHaveBeenCalled();
      addSpy.mockRestore();
    });
  });

  // ============================
  // Partial returns
  // ============================

  describe("partial returns from callback", () => {
    it("should work with empty return object — mutationContext is undefined", async () => {
      const successSpy = vi.fn();
      const optimisticRequest = request.setOptimistic(() => ({}));
      const mock = mockRequest(optimisticRequest);
      const response = renderUseSubmit(optimisticRequest);

      act(() => {
        response.result.current.onSubmitSuccess(successSpy);
        response.result.current.submit();
      });

      await testSuccessState(mock, response);
      expect(successSpy).toHaveBeenCalledTimes(1);
      expect(successSpy.mock.calls[0][0].mutationContext).toBeUndefined();
    });

    it("should work with only context returned (no rollback, no invalidate)", async () => {
      const successSpy = vi.fn();
      const optimisticRequest = request.setOptimistic(() => ({
        context: { partial: true },
      }));
      const mock = mockRequest(optimisticRequest);
      const response = renderUseSubmit(optimisticRequest);

      act(() => {
        response.result.current.onSubmitSuccess(successSpy);
        response.result.current.submit();
      });

      await testSuccessState(mock, response);
      expect(successSpy.mock.calls[0][0].mutationContext).toStrictEqual({ partial: true });
    });

    it("should work with only rollback returned (no context)", async () => {
      const rollbackSpy = vi.fn();
      const errorSpy = vi.fn();
      const optimisticRequest = request.setOptimistic(() => ({
        rollback: rollbackSpy,
      }));
      const mock = mockRequest(optimisticRequest, { status: 400 });
      const response = renderUseSubmit(optimisticRequest);

      act(() => {
        response.result.current.onSubmitError(errorSpy);
        response.result.current.submit();
      });

      await testErrorState(mock, response);
      expect(rollbackSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][0].mutationContext).toBeUndefined();
    });
  });

  // ============================
  // Retry interaction
  // ============================

  describe("retry interaction", () => {
    it("should run optimistic callback once before first attempt (not on retries)", async () => {
      const optimisticSpy = vi.fn(() => ({
        context: { snapshot: "data" },
        rollback: vi.fn(),
      }));

      const optimisticRequest = request.setOptimistic(optimisticSpy).setRetry(1).setRetryTime(50);
      mockRequest(optimisticRequest, { status: 400 });
      const response = renderUseSubmit(optimisticRequest);

      act(() => {
        response.result.current.submit();
      });

      await waitFor(() => {
        expect(response.result.current.error).toBeDefined();
      });

      expect(optimisticSpy).toHaveBeenCalledTimes(1);
    });

    it("should call rollback only on final failure after retries exhausted", async () => {
      const rollbackSpy = vi.fn();
      const errorSpy = vi.fn();

      const optimisticRequest = request
        .setOptimistic(() => ({
          context: { snapshot: "v1" },
          rollback: rollbackSpy,
        }))
        .setRetry(1)
        .setRetryTime(50);

      mockRequest(optimisticRequest, { status: 400 });
      const response = renderUseSubmit(optimisticRequest);

      act(() => {
        response.result.current.onSubmitError(errorSpy);
        response.result.current.submit();
      });

      await waitFor(() => {
        expect(errorSpy).toHaveBeenCalledTimes(2);
      });

      expect(rollbackSpy).toHaveBeenCalledTimes(1);
    });

    it("should not call rollback when retry succeeds after initial failure", async () => {
      const rollbackSpy = vi.fn();
      const successSpy = vi.fn();

      const optimisticRequest = request
        .setOptimistic(() => ({
          context: { snapshot: "v1" },
          rollback: rollbackSpy,
        }))
        .setRetry(1)
        .setRetryTime(50);

      const errorMock = mockRequest(optimisticRequest, { status: 400 });
      const response = renderUseSubmit(optimisticRequest);

      act(() => {
        response.result.current.onSubmitSuccess(successSpy);
        response.result.current.submit();
      });

      await testErrorState(errorMock, response);
      const successMock = mockRequest(optimisticRequest);

      await testSuccessState(successMock, response);
      expect(rollbackSpy).not.toHaveBeenCalled();
      expect(successSpy).toHaveBeenCalledTimes(1);
      expect(successSpy.mock.calls[0][0].mutationContext).toStrictEqual({ snapshot: "v1" });
    });
  });

  // ============================
  // Disabled
  // ============================

  describe("disabled", () => {
    it("should not run optimistic callback when disabled is true", async () => {
      const optimisticSpy = vi.fn(() => ({ context: { test: true } }));
      const optimisticRequest = request.setOptimistic(optimisticSpy);
      mockRequest(optimisticRequest);

      const response = renderUseSubmit(optimisticRequest, { disabled: true });

      await act(async () => {
        await response.result.current.submit();
      });

      expect(optimisticSpy).not.toHaveBeenCalled();
    });
  });

  // ============================
  // Bounce guard
  // ============================

  describe("bounce with optimistic", () => {
    it("should call optimistic callback when bounced request actually fires", async () => {
      const optimisticSpy = vi.fn(() => ({ context: { test: true } }));
      const successSpy = vi.fn();
      const optimisticRequest = request.setOptimistic(optimisticSpy);
      const mock = mockRequest(optimisticRequest);

      const response = renderUseSubmit(optimisticRequest, { bounce: true, bounceTime: 50 });

      act(() => {
        response.result.current.onSubmitSuccess(successSpy);
        response.result.current.submit();
      });

      await testSuccessState(mock, response);
      expect(optimisticSpy).toHaveBeenCalledTimes(1);
      expect(successSpy.mock.calls[0][0].mutationContext).toStrictEqual({ test: true });
    });
  });

  // ============================
  // Callback ordering
  // ============================

  describe("callback ordering", () => {
    it("should call in order: rollback → onSubmitError → onSubmitFinished on failure", async () => {
      const callOrder: string[] = [];

      const optimisticRequest = request.setOptimistic(() => ({
        context: { snapshot: "data" },
        rollback: () => callOrder.push("rollback"),
      }));

      const mock = mockRequest(optimisticRequest, { status: 400 });
      const response = renderUseSubmit(optimisticRequest);

      act(() => {
        response.result.current.onSubmitError(() => {
          callOrder.push("onSubmitError");
        });
        response.result.current.onSubmitFinished(() => {
          callOrder.push("onSubmitFinished");
        });
        response.result.current.submit();
      });

      await testErrorState(mock, response);
      expect(callOrder).toStrictEqual(["rollback", "onSubmitError", "onSubmitFinished"]);
    });

    it("should call in order: invalidate → onSubmitSuccess → onSubmitFinished on success", async () => {
      const callOrder: string[] = [];
      const listRequest = client.createRequest()({ endpoint: "/list" });
      const invalidateSpy = vi.spyOn(client.cache, "invalidate").mockImplementation(() => {
        callOrder.push("invalidate");
      });

      const optimisticRequest = request.setOptimistic(() => ({
        context: { snapshot: "data" },
        invalidate: [listRequest],
      }));

      const mock = mockRequest(optimisticRequest);
      const response = renderUseSubmit(optimisticRequest);

      act(() => {
        response.result.current.onSubmitSuccess(() => {
          callOrder.push("onSubmitSuccess");
        });
        response.result.current.onSubmitFinished(() => {
          callOrder.push("onSubmitFinished");
        });
        response.result.current.submit();
      });

      await testSuccessState(mock, response);
      expect(callOrder).toStrictEqual(["invalidate", "onSubmitSuccess", "onSubmitFinished"]);
      invalidateSpy.mockRestore();
    });
  });

  // ============================
  // onMutate throws
  // ============================

  describe("onMutate throws", () => {
    it("should resolve submit promise with error when optimistic callback throws", async () => {
      const addSpy = vi.spyOn(client.submitDispatcher, "add");

      const optimisticRequest = request.setOptimistic(() => {
        throw new Error("onMutate failed");
      });

      const response = renderUseSubmit(optimisticRequest);

      let submitResult: any;
      await act(async () => {
        submitResult = await response.result.current.submit();
      });

      expect(submitResult.error).toBeDefined();
      expect(submitResult.error.message).toContain("Optimistic callback");
      expect(submitResult.data).toBeNull();
      expect(addSpy).not.toHaveBeenCalled();
      addSpy.mockRestore();
    });
  });

  // ============================
  // Regression (no optimistic)
  // ============================

  describe("regression (no optimistic)", () => {
    it("should work identically when no setOptimistic is used", async () => {
      const successSpy = vi.fn();
      const mock = mockRequest(request);
      const response = renderUseSubmit(request);

      act(() => {
        response.result.current.onSubmitSuccess(successSpy);
        response.result.current.submit();
      });

      await testSuccessState(mock, response);
      expect(successSpy).toHaveBeenCalledTimes(1);
      expect(successSpy.mock.calls[0][0].mutationContext).toBeUndefined();
    });

    it("should pass undefined mutationContext in all callbacks when no optimistic is set", async () => {
      const successSpy = vi.fn();
      const finishedSpy = vi.fn();
      const mock = mockRequest(request);
      const response = renderUseSubmit(request);

      act(() => {
        response.result.current.onSubmitSuccess(successSpy);
        response.result.current.onSubmitFinished(finishedSpy);
        response.result.current.submit();
      });

      await testSuccessState(mock, response);
      expect(successSpy.mock.calls[0][0].mutationContext).toBeUndefined();
      expect(finishedSpy.mock.calls[0][0].mutationContext).toBeUndefined();
    });
  });

  // ============================
  // Concurrency
  // ============================

  describe("concurrency", () => {
    it("should handle two concurrent submits with independent mutationContext", async () => {
      const request1 = createRequest({ method: "POST" }).setOptimistic(() => ({
        context: { id: "submit-1" },
      }));
      const request2 = createRequest({ method: "POST" }).setOptimistic(() => ({
        context: { id: "submit-2" },
      }));

      const mock1 = mockRequest(request1);
      const mock2 = mockRequest(request2);

      const successSpy1 = vi.fn();
      const successSpy2 = vi.fn();

      const response1 = renderUseSubmit(request1);
      const response2 = renderUseSubmit(request2);

      act(() => {
        response1.result.current.onSubmitSuccess(successSpy1);
        response2.result.current.onSubmitSuccess(successSpy2);
        response1.result.current.submit();
        response2.result.current.submit();
      });

      await testSuccessState(mock1, response1);
      await testSuccessState(mock2, response2);

      expect(successSpy1.mock.calls[0][0].mutationContext).toStrictEqual({ id: "submit-1" });
      expect(successSpy2.mock.calls[0][0].mutationContext).toStrictEqual({ id: "submit-2" });
    });
  });
});
