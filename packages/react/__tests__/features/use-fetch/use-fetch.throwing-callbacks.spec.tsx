import { act, renderHook, waitFor } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";

import { createGatedClient } from "../../utils/gated-client.utils";
import { collectThrownErrors } from "../../utils/helpers.utils";

type User = { id: number };

/**
 * Callbacks of a hook run inside of the request lifecycle, next to the listeners of other hooks. A throwing one
 * can't keep the response from the other hooks - its error is thrown outside of the lifecycle instead.
 */
describe("useFetch [ Throwing callbacks ]", () => {
  const failure = new Error("Callback failed");
  const fail = () => {
    throw failure;
  };

  const setup = () => {
    const gated = createGatedClient();
    const request = gated.client.createRequest<{ response: User }>()({ endpoint: "/users/1" });
    return { ...gated, request };
  };

  it.each(["onSuccess", "onFinished", "onRequestStart", "onResponseStart"] as const)(
    "should still give the data to the other hooks when %s of one of them throws",
    async (name) => {
      const thrown = collectThrownErrors();
      const { request, waitForCall } = setup();
      const onSuccess = vi.fn();
      const failing = renderHook(() => {
        const state = useFetch(request, { dependencyTracking: false });
        state[name](fail);
        return state;
      });
      const other = renderHook(() => {
        const state = useFetch(request, { dependencyTracking: false });
        state.onSuccess(onSuccess);
        return state;
      });
      const call = await waitForCall(0);

      act(() => {
        call.succeed({ id: 1 });
      });

      await waitFor(() => {
        expect(other.result.current.data).toStrictEqual({ id: 1 });
      });
      expect(failing.result.current.data).toStrictEqual({ id: 1 });
      expect(other.result.current.loading).toBeFalse();
      expect(onSuccess).toHaveBeenCalledTimes(1);
      await waitFor(() => {
        expect(thrown).toStrictEqual([failure]);
      });
    },
  );

  it("should still call the error callback of the other hooks when onError of one of them throws", async () => {
    const thrown = collectThrownErrors();
    const { request, waitForCall } = setup();
    const onError = vi.fn();
    renderHook(() => useFetch(request, { dependencyTracking: false }).onError(fail));
    const other = renderHook(() => {
      const state = useFetch(request, { dependencyTracking: false });
      state.onError(onError);
      return state;
    });
    const call = await waitForCall(0);

    act(() => {
      call.fail({ message: "Nope" }, 400);
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
    });
    expect(other.result.current.error).toStrictEqual({ message: "Nope" });
    await waitFor(() => {
      expect(thrown).toStrictEqual([failure]);
    });
  });

  it("should fetch again after a callback threw", async () => {
    collectThrownErrors();
    const { request, waitForCall } = setup();
    const { result } = renderHook(() => {
      const state = useFetch(request, { dependencyTracking: false });
      state.onSuccess(fail);
      return state;
    });
    const first = await waitForCall(0);
    act(() => {
      first.succeed({ id: 1 });
    });
    await waitFor(() => {
      expect(result.current.loading).toBeFalse();
    });

    act(() => {
      result.current.refetch();
    });
    const second = await waitForCall(1);
    act(() => {
      second.succeed({ id: 2 });
    });

    await waitFor(() => {
      expect(result.current.data).toStrictEqual({ id: 2 });
    });
  });
});
