import { getErrorMessage } from "@hyper-fetch/core";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useSubmit } from "hooks/use-submit";
import { StrictMode } from "react";

import { createGatedClient } from "../../utils/gated-client.utils";

type User = { id: number; name: string };

const setup = () => {
  const gated = createGatedClient();
  const request = gated.client.createRequest<{
    response: User;
    payload: { name: string };
    error: { message: string };
  }>()({ endpoint: "/users", method: "POST" });
  return { ...gated, request };
};

describe("useSubmit [ Signal and throwOnError ]", () => {
  describe.each([
    ["without StrictMode", undefined],
    ["in StrictMode", StrictMode],
  ] as const)("when the submit call gets a signal %s", (_, wrapper) => {
    it("should abort only that submit call", async () => {
      const { request, waitForCalls } = setup();
      const controller = new AbortController();
      const { result } = renderHook(() => useSubmit(request, { dependencyTracking: false }), { wrapper });

      let aborted: Promise<unknown> = Promise.resolve();
      let other: Promise<unknown> = Promise.resolve();
      act(() => {
        aborted = result.current.submit({
          payload: { name: "A" },
          signal: controller.signal,
        });
        other = result.current.submit({ payload: { name: "B" } });
      });
      const [first, second] = await waitForCalls(2);

      await act(async () => {
        controller.abort();
        await aborted;
      });
      act(() => second.succeed({ id: 2, name: "B" }));

      await expect(aborted).resolves.toHaveProperty("error", getErrorMessage("abort"));
      await expect(other).resolves.toHaveProperty("data", { id: 2, name: "B" });
      expect(first.aborted).toBeTrue();
      expect(second.aborted).toBeFalse();
      await waitFor(() => expect(result.current.submitting).toBeFalse());
    });

    it("should not send the submit call when the signal is aborted already", async () => {
      const { request, calls } = setup();
      const controller = new AbortController();
      controller.abort();
      const { result } = renderHook(() => useSubmit(request, { dependencyTracking: false }), { wrapper });

      let response: unknown;
      await act(async () => {
        response = await result.current.submit({
          payload: { name: "A" },
          signal: controller.signal,
        });
      });

      expect(response).toHaveProperty("error", getErrorMessage("abort"));
      expect(calls).toHaveLength(0);
    });
  });

  describe("when the request has throwOnError", () => {
    it("should resolve submit with the error response and report it in the state", async () => {
      const { request, waitForCall } = setup();
      const { result } = renderHook(() => useSubmit(request.setThrowOnError(true), { dependencyTracking: false }));

      let submitted: Promise<unknown> = Promise.resolve();
      act(() => {
        submitted = result.current.submit({ payload: { name: "A" } });
      });
      const call = await waitForCall(0);
      act(() => call.fail({ message: "Failed" }, 400));

      await expect(submitted).resolves.toHaveProperty("error", {
        message: "Failed",
      });
      await waitFor(() => expect(result.current.error).toEqual({ message: "Failed" }));
    });
  });
});
