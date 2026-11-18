import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { useSubmit } from "hooks/use-submit";

import { createGatedClient } from "../../utils/gated-client.utils";

type User = { id: number; name: string };

const setup = () => {
  const gated = createGatedClient();
  const request = gated.client.createRequest<{ response: User; payload: { name: string } }>()({
    endpoint: "/users",
    method: "POST",
  });
  /** Renders the hook and finishes one submit with the given outcome */
  const renderSubmitted = async (outcome: "success" | "error" = "success") => {
    const view = renderHook(() => useSubmit(request, { dependencyTracking: false }));
    let promise: Promise<unknown> = Promise.resolve();
    act(() => {
      promise = view.result.current.submit({ payload: { name: "Maciej" } });
    });
    const call = await gated.waitForCall(0);
    await act(async () => {
      if (outcome === "success") {
        call.succeed({ id: 1, name: "Maciej" });
      } else {
        call.fail({ message: "Nope" }, 400);
      }
      await promise;
    });
    await waitFor(() => {
      expect(view.result.current.responseTimestamp).toBeDate();
    });
    return view;
  };
  return { ...gated, request, renderSubmitted };
};

describe("useSubmit [ Actions ]", () => {
  describe("when changing the state by hand", () => {
    it("should set the data", () => {
      const { request } = setup();
      const { result } = renderHook(() => useSubmit(request, { dependencyTracking: false }));

      act(() => {
        result.current.setData({ id: 5, name: "Local" });
      });

      expect(result.current.data).toStrictEqual({ id: 5, name: "Local" });
    });
    it("should set the data based on the previous value", async () => {
      const { renderSubmitted } = setup();
      const { result } = await renderSubmitted();

      act(() => {
        result.current.setData((previous) => (previous ? { ...previous, name: `${previous.name}!` } : null));
      });

      expect(result.current.data).toStrictEqual({ id: 1, name: "Maciej!" });
    });
    it("should clear the data", async () => {
      const { renderSubmitted } = setup();
      const { result } = await renderSubmitted();

      act(() => {
        result.current.setData(null);
      });

      expect(result.current.data).toBeNull();
    });
    it("should set and clear the error", async () => {
      const { renderSubmitted } = setup();
      const { result } = await renderSubmitted("error");
      expect(result.current.error).toStrictEqual({ message: "Nope" });

      act(() => {
        result.current.setError(null);
      });
      expect(result.current.error).toBeNull();

      act(() => {
        result.current.setError(new Error("Local error"));
      });
      expect(result.current.error).toStrictEqual(new Error("Local error"));
    });
    it("should set the submitting state with setLoading", () => {
      const { request } = setup();
      const { result } = renderHook(() => useSubmit(request, { dependencyTracking: false }));

      act(() => {
        result.current.setLoading(true);
      });
      expect(result.current.submitting).toBeTrue();

      act(() => {
        result.current.setLoading(false);
      });
      expect(result.current.submitting).toBeFalse();
    });
    it("should set the status, success, extra and retries", () => {
      const { request } = setup();
      const { result } = renderHook(() => useSubmit(request, { dependencyTracking: false }));

      act(() => {
        result.current.setStatus(202);
        result.current.setSuccess(true);
        result.current.setExtra({ headers: { "x-test": "1" } });
        result.current.setRetries(3);
      });

      expect(result.current.status).toBe(202);
      expect(result.current.success).toBeTrue();
      expect(result.current.extra).toStrictEqual({ headers: { "x-test": "1" } });
      expect(result.current.retries).toBe(3);
    });
    it("should set the timestamps", () => {
      const { request } = setup();
      const { result } = renderHook(() => useSubmit(request, { dependencyTracking: false }));
      const requestDate = new Date(2020, 1, 1);
      const responseDate = new Date(2020, 1, 2);

      act(() => {
        result.current.setRequestTimestamp(requestDate);
        result.current.setResponseTimestamp(responseDate);
      });

      expect(result.current.requestTimestamp).toStrictEqual(requestDate);
      expect(result.current.responseTimestamp).toStrictEqual(responseDate);
    });
    it("should keep the local changes inside of the hook", async () => {
      const { request, client, renderSubmitted } = setup();
      const { result } = await renderSubmitted();
      const other = renderHook(() => useSubmit(request, { dependencyTracking: false }));

      act(() => {
        result.current.setData({ id: 5, name: "Local" });
      });

      expect(other.result.current.data).toStrictEqual({ id: 1, name: "Maciej" });
      expect(client.cache.get(request.cacheKey)?.data).toStrictEqual({ id: 1, name: "Maciej" });
    });
    it("should replace the local data with the next response", async () => {
      const { waitForCall, renderSubmitted } = setup();
      const { result } = await renderSubmitted();
      act(() => {
        result.current.setData({ id: 5, name: "Local" });
      });

      act(() => {
        result.current.submit({ payload: { name: "Kacper" } });
      });
      const call = await waitForCall(1);
      act(() => {
        call.succeed({ id: 2, name: "Kacper" });
      });

      await waitFor(() => {
        expect(result.current.data).toStrictEqual({ id: 2, name: "Kacper" });
      });
    });
  });

  describe("when clearing the state", () => {
    it("should clear the result of a successful submit", async () => {
      const { renderSubmitted } = setup();
      const { result } = await renderSubmitted();

      act(() => {
        result.current.clearState();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.status).toBeNull();
      expect(result.current.success).toBeFalse();
      expect(result.current.submitting).toBeFalse();
      expect(result.current.retries).toBe(0);
      expect(result.current.requestTimestamp).toBeNull();
      expect(result.current.responseTimestamp).toBeNull();
    });
    it("should clear the result of a failed submit", async () => {
      const { renderSubmitted } = setup();
      const { result } = await renderSubmitted("error");

      act(() => {
        result.current.clearState();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.status).toBeNull();
    });
    it("should allow to submit again afterwards", async () => {
      const { waitForCall, renderSubmitted } = setup();
      const { result } = await renderSubmitted("error");
      act(() => {
        result.current.clearState();
      });

      act(() => {
        result.current.submit({ payload: { name: "Kacper" } });
      });
      const call = await waitForCall(1);
      expect(result.current.submitting).toBeTrue();
      act(() => {
        call.succeed({ id: 2, name: "Kacper" });
      });

      await waitFor(() => {
        expect(result.current.data).toStrictEqual({ id: 2, name: "Kacper" });
      });
      expect(result.current.success).toBeTrue();
    });
    it("should not clear the state of another hook using the same request", async () => {
      const { request, renderSubmitted } = setup();
      const { result } = await renderSubmitted();
      const other = renderHook(() => useSubmit(request, { dependencyTracking: false }));

      act(() => {
        result.current.clearState();
      });

      expect(other.result.current.data).toStrictEqual({ id: 1, name: "Maciej" });
    });
  });

  describe("when using the initialResponse option", () => {
    it("should start with the given response", () => {
      const { request } = setup();
      const { result } = renderHook(() =>
        useSubmit(request, {
          dependencyTracking: false,
          initialResponse: { data: { id: 7, name: "Draft" }, status: 200 },
        }),
      );

      expect(result.current.data).toStrictEqual({ id: 7, name: "Draft" });
      expect(result.current.status).toBe(200);
      expect(result.current.submitting).toBeFalse();
    });
    it("should not send any request for the initial response", async () => {
      const { request, calls, client } = setup();
      renderHook(() =>
        useSubmit(request, { dependencyTracking: false, initialResponse: { data: { id: 7, name: "Draft" } } }),
      );

      expect(calls).toHaveLength(0);
      expect(client.submitDispatcher.getAllRunningRequests()).toHaveLength(0);
    });
    it("should replace the initial response with the real one", async () => {
      const { request, waitForCall } = setup();
      const { result } = renderHook(() =>
        useSubmit(request, { dependencyTracking: false, initialResponse: { data: { id: 7, name: "Draft" } } }),
      );

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });

      await waitFor(() => {
        expect(result.current.data).toStrictEqual({ id: 1, name: "Maciej" });
      });
    });
  });

  describe("when using the select option", () => {
    it("should keep the selected part of the response in the data", async () => {
      const { request, waitForCall } = setup();
      const { result } = renderHook(() =>
        useSubmit(request, { dependencyTracking: false, select: (user) => user.name.toUpperCase() }),
      );

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });

      await waitFor(() => {
        expect(result.current.data).toBe("MACIEJ");
      });
    });
    it("should pass the full response to the callbacks", async () => {
      const { request, waitForCall } = setup();
      const success = vi.fn();
      const { result } = renderHook(() => {
        const view = useSubmit(request, { dependencyTracking: false, select: (user) => user.name });
        view.onSubmitSuccess(success);
        return view;
      });
      let promise: Promise<unknown> = Promise.resolve();

      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      await act(async () => {
        call.succeed({ id: 1, name: "Maciej" });
        await promise;
      });

      expect(success.mock.calls[0][0].response.data).toStrictEqual({ id: 1, name: "Maciej" });
    });
    it("should select again when the selector changes", async () => {
      const { request, waitForCall } = setup();
      const { result, rerender } = renderHook(
        ({ field }: { field: keyof User }) =>
          useSubmit(request, { dependencyTracking: false, select: (user) => user[field] }),
        { initialProps: { field: "name" as keyof User } },
      );
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });
      await waitFor(() => {
        expect(result.current.data).toBe("Maciej");
      });

      rerender({ field: "id" });

      expect(result.current.data).toBe(1);
    });
    it("should keep the data empty until the first response", () => {
      const { request } = setup();
      const select = vi.fn((user: User) => user.name);
      const { result } = renderHook(() => useSubmit(request, { dependencyTracking: false, select }));

      expect(result.current.data).toBeNull();
      expect(select).not.toHaveBeenCalled();
    });
  });

  describe("when the component reads only a part of the state", () => {
    it("should not rerender a component that reads only the submit function", async () => {
      const { request, waitForCall } = setup();
      let renders = 0;
      let submit: ReturnType<typeof useSubmit<typeof request>>["submit"] | null = null;
      function Page() {
        renders += 1;
        ({ submit } = useSubmit(request));
        return <div>form</div>;
      }
      render(<Page />);
      let promise: Promise<unknown> = Promise.resolve();

      act(() => {
        promise = submit!({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      await act(async () => {
        call.succeed({ id: 1, name: "Maciej" });
        await promise;
      });

      expect(renders).toBe(1);
    });
    it("should rerender a component that reads the submitting state", async () => {
      const { request, waitForCall } = setup();
      let submit: ReturnType<typeof useSubmit<typeof request>>["submit"] | null = null;
      function Page() {
        const view = useSubmit(request);
        ({ submit } = view);
        return <div data-testid="state">{view.submitting ? "saving" : "idle"}</div>;
      }
      render(<Page />);

      act(() => {
        submit!({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      expect(screen.getByTestId("state").textContent).toBe("saving");
      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });

      await waitFor(() => {
        expect(screen.getByTestId("state").textContent).toBe("idle");
      });
    });
    it("should rerender a component that reads the data only when the data changes", async () => {
      const { request, waitForCall } = setup();
      const rendered: (string | null)[] = [];
      let submit: ReturnType<typeof useSubmit<typeof request>>["submit"] | null = null;
      function Page() {
        const view = useSubmit(request);
        ({ submit } = view);
        rendered.push(view.data?.name ?? null);
        return <div data-testid="state">{view.data?.name ?? "none"}</div>;
      }
      render(<Page />);

      act(() => {
        submit!({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });

      await waitFor(() => {
        expect(screen.getByTestId("state").textContent).toBe("Maciej");
      });
      expect(rendered).toStrictEqual([null, "Maciej"]);
    });
    it("should keep the data reference when the same response comes again", async () => {
      const { waitForCall, renderSubmitted } = setup();
      const { result } = await renderSubmitted();
      const firstData = result.current.data;
      let promise: Promise<unknown> = Promise.resolve();

      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(1);
      await act(async () => {
        call.succeed({ id: 1, name: "Maciej" });
        await promise;
      });
      await waitFor(() => {
        expect(result.current.submitting).toBeFalse();
      });

      expect(result.current.data).toBe(firstData);
    });
  });
});
