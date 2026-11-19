import { act, renderHook, waitFor } from "@testing-library/react";
import { useSubmit } from "hooks/use-submit";

import { createGatedClient } from "../../utils/gated-client.utils";

type User = { id: number; name: string };

const setup = (options?: { queued?: boolean }) => {
  const gated = createGatedClient();
  const request = gated.client.createRequest<{ response: User; payload: { name: string } }>()({
    endpoint: "/users",
    method: "POST",
    queued: options?.queued ?? false,
    deduplicate: false,
  });
  /** Everything that got to the adapter, with the requests canceled by the library marked */
  const sent = () =>
    gated.calls.map((call) => ({ name: (call.request.payload as { name: string }).name, aborted: call.aborted }));
  return { ...gated, request, sent };
};

/**
 * The callbacks of a response run while the answered request is still in its queue. Submitting the next step
 * from one of them must send only that step.
 */
describe("useSubmit [ Chaining ]", () => {
  describe.each([
    ["concurrent", false],
    ["queued", true],
  ])("when the next %s submit is sent from a callback", (_name, queued) => {
    it("should send only the next request from onSubmitSuccess", async () => {
      const { request, waitForCall, sent } = setup({ queued });
      const { result } = renderHook(() => {
        const view = useSubmit(request, { dependencyTracking: false });
        view.onSubmitSuccess(({ response }) => {
          if (response.data.name === "First") {
            view.submit({ payload: { name: "Second" } });
          }
        });
        return view;
      });
      act(() => {
        result.current.submit({ payload: { name: "First" } });
      });
      const firstCall = await waitForCall(0);

      act(() => {
        firstCall.succeed({ id: 1, name: "First" });
      });
      const secondCall = await waitForCall(1);
      act(() => {
        secondCall.succeed({ id: 2, name: "Second" });
      });
      await waitFor(() => {
        expect(result.current.data).toStrictEqual({ id: 2, name: "Second" });
      });

      expect(sent()).toStrictEqual([
        { name: "First", aborted: false },
        { name: "Second", aborted: false },
      ]);
    });

    it("should send only the next request from onSubmitError", async () => {
      const { request, waitForCall, sent } = setup({ queued });
      let retried = false;
      const { result } = renderHook(() => {
        const view = useSubmit(request, { dependencyTracking: false });
        view.onSubmitError(() => {
          if (!retried) {
            retried = true;
            view.submit({ payload: { name: "Second" } });
          }
        });
        return view;
      });
      act(() => {
        result.current.submit({ payload: { name: "First" } });
      });
      const firstCall = await waitForCall(0);

      act(() => {
        firstCall.fail({ message: "Nope" }, 400);
      });
      const secondCall = await waitForCall(1);
      act(() => {
        secondCall.succeed({ id: 2, name: "Second" });
      });
      await waitFor(() => {
        expect(result.current.data).toStrictEqual({ id: 2, name: "Second" });
      });

      expect(sent()).toStrictEqual([
        { name: "First", aborted: false },
        { name: "Second", aborted: false },
      ]);
    });

    it("should send only the next request from onSubmitFinished", async () => {
      const { request, waitForCall, sent } = setup({ queued });
      const { result } = renderHook(() => {
        const view = useSubmit(request, { dependencyTracking: false });
        view.onSubmitFinished(({ response }) => {
          if (response.data?.name === "First") {
            view.submit({ payload: { name: "Second" } });
          }
        });
        return view;
      });
      act(() => {
        result.current.submit({ payload: { name: "First" } });
      });
      const firstCall = await waitForCall(0);

      act(() => {
        firstCall.succeed({ id: 1, name: "First" });
      });
      const secondCall = await waitForCall(1);
      act(() => {
        secondCall.succeed({ id: 2, name: "Second" });
      });
      await waitFor(() => {
        expect(result.current.submitting).toBeFalse();
      });

      expect(sent()).toStrictEqual([
        { name: "First", aborted: false },
        { name: "Second", aborted: false },
      ]);
    });

    it("should call the success callback once for every step", async () => {
      const { request, waitForCall } = setup({ queued });
      const names: string[] = [];
      const { result } = renderHook(() => {
        const view = useSubmit(request, { dependencyTracking: false });
        view.onSubmitSuccess(({ response }) => {
          names.push(response.data.name);
          if (response.data.name === "First") {
            view.submit({ payload: { name: "Second" } });
          }
        });
        return view;
      });
      act(() => {
        result.current.submit({ payload: { name: "First" } });
      });
      const firstCall = await waitForCall(0);

      act(() => {
        firstCall.succeed({ id: 1, name: "First" });
      });
      const secondCall = await waitForCall(1);
      act(() => {
        secondCall.succeed({ id: 2, name: "Second" });
      });
      await waitFor(() => {
        expect(names).toHaveLength(2);
      });
      await waitFor(() => {
        expect(result.current.submitting).toBeFalse();
      });

      expect(names).toStrictEqual(["First", "Second"]);
    });
  });
});
