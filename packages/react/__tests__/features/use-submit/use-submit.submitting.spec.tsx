import { act, renderHook, waitFor } from "@testing-library/react";
import { useSubmit } from "hooks/use-submit";
import { StrictMode } from "react";

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
  return { ...gated, request };
};

/**
 * One hook can have several requests on the way: queued one after another, or sent with different params (and so
 * different keys). `submitting` is true from the first submit until the last of them is done.
 */
describe("useSubmit [ Submitting ]", () => {
  /** Renders the hook and records every value of `submitting` that a component would see */
  const renderWithHistory = (request: Parameters<typeof useSubmit>[0], wrapper?: typeof StrictMode) => {
    const history: boolean[] = [];
    const view = renderHook(
      () => {
        const submit = useSubmit(request, { dependencyTracking: false });
        if (history.at(-1) !== submit.submitting) {
          history.push(submit.submitting);
        }
        return submit;
      },
      { wrapper },
    );
    return { ...view, history };
  };

  describe("when the requests are queued", () => {
    it.each([
      ["a component", undefined],
      ["a component in StrictMode", StrictMode],
    ])("should stay submitting between the requests for %s", async (_name, wrapper) => {
      const { request, waitForCall } = setup({ queued: true });
      const { result, history } = renderWithHistory(request, wrapper);
      let promises: Promise<unknown>[] = [];
      act(() => {
        promises = ["First", "Second", "Third"].map((name) => result.current.submit({ payload: { name } }));
      });

      for (let index = 0; index < 3; index += 1) {
        // eslint-disable-next-line no-await-in-loop
        const call = await waitForCall(index);
        // eslint-disable-next-line no-await-in-loop
        await act(async () => {
          call.succeed({ id: index, name: "User" });
          await promises[index];
        });
      }
      await waitFor(() => {
        expect(result.current.submitting).toBeFalse();
      });

      expect(history).toStrictEqual([false, true, false]);
    });

    it("should stay submitting when one of the requests fails", async () => {
      const { request, waitForCall } = setup({ queued: true });
      const { result, history } = renderWithHistory(request);
      let promises: Promise<unknown>[] = [];
      act(() => {
        promises = ["First", "Second"].map((name) => result.current.submit({ payload: { name } }));
      });

      const first = await waitForCall(0);
      await act(async () => {
        first.fail({ message: "Failed" }, 400);
        await promises[0];
      });
      expect(result.current.submitting).toBeTrue();

      const second = await waitForCall(1);
      await act(async () => {
        second.succeed({ id: 2, name: "Second" });
        await promises[1];
      });
      await waitFor(() => {
        expect(result.current.submitting).toBeFalse();
      });

      expect(history).toStrictEqual([false, true, false]);
      expect(result.current.data).toStrictEqual({ id: 2, name: "Second" });
    });

    it("should stop submitting when the remaining requests are aborted", async () => {
      const { request, waitForCall } = setup({ queued: true });
      const { result } = renderWithHistory(request);
      let promises: Promise<unknown>[] = [];
      act(() => {
        promises = ["First", "Second"].map((name) => result.current.submit({ payload: { name } }));
      });
      const first = await waitForCall(0);
      await act(async () => {
        first.succeed({ id: 1, name: "First" });
        await promises[0];
      });
      await waitForCall(1);

      await act(async () => {
        result.current.abort();
        await promises[1];
      });

      await waitFor(() => {
        expect(result.current.submitting).toBeFalse();
      });
    });
  });

  describe("when the requests have different keys", () => {
    it("should stay submitting until every one of them is done", async () => {
      const { client, waitForCalls } = setup();
      const request = client.createRequest<{ response: User }>()({ endpoint: "/users/:userId", method: "DELETE" });
      const { result, history } = renderWithHistory(request as Parameters<typeof useSubmit>[0]);
      let promises: Promise<unknown>[] = [];
      act(() => {
        promises = [1, 2].map((userId) => result.current.submit({ params: { userId } } as never));
      });
      const calls = await waitForCalls(2);

      await act(async () => {
        calls[1].succeed({ id: 2, name: "Second" });
        await promises[1];
      });
      expect(client.submitDispatcher.getAllRunningRequests()).toHaveLength(1);
      expect(result.current.submitting).toBeTrue();

      await act(async () => {
        calls[0].succeed({ id: 1, name: "First" });
        await promises[0];
      });
      await waitFor(() => {
        expect(result.current.submitting).toBeFalse();
      });

      expect(history).toStrictEqual([false, true, false]);
    });
  });

  describe("when there is a single request", () => {
    it.each([
      ["succeeds", true],
      ["fails", false],
    ])("should stop submitting when it %s", async (_name, success) => {
      const { request, waitForCall } = setup();
      const { result, history } = renderWithHistory(request);
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      await act(async () => {
        if (success) {
          call.succeed({ id: 1, name: "Maciej" });
        } else {
          call.fail({ message: "Failed" }, 400);
        }
        await promise;
      });
      await waitFor(() => {
        expect(result.current.submitting).toBeFalse();
      });

      expect(history).toStrictEqual([false, true, false]);
    });
  });
});
