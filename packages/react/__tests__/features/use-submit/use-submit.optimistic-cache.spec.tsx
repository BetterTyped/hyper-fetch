import { act, renderHook, waitFor } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";
import { useSubmit } from "hooks/use-submit";

import { createGatedClient } from "../../utils/gated-client.utils";

type User = { id: number; name: string };

/**
 * A list (`GET /users`) rendered with useFetch and a mutation (`POST /users`) rendered with useSubmit in one tree.
 * The mutation adds the new user to the cached list optimistically and describes how to take it back.
 */
const setup = (options?: { retry?: number; retryTime?: number; cancelable?: boolean; invalidate?: boolean }) => {
  const gated = createGatedClient();
  const { client } = gated;
  const getUsers = client.createRequest<{ response: User[] }>()({ endpoint: "/users" });
  const rollbackSpy = vi.fn();
  let temporaryId = 0;

  const createUser = client
    .createRequest<{ response: User; payload: { name: string } }>()({
      endpoint: "/users",
      method: "POST",
      retry: options?.retry ?? 0,
      retryTime: options?.retryTime ?? 0,
      cancelable: options?.cancelable ?? false,
    })
    .setOptimistic(({ payload }) => {
      temporaryId -= 1;
      const optimisticUser = { id: temporaryId, name: payload.name };
      client.cache.update(getUsers, (previous) => ({ data: [...(previous?.data ?? []), optimisticUser] }));

      return {
        context: { optimisticUser },
        rollback: () => {
          rollbackSpy(optimisticUser.name);
          client.cache.update(getUsers, (previous) => ({
            data: (previous?.data ?? []).filter((user) => user.id !== optimisticUser.id),
          }));
        },
        invalidate: options?.invalidate === false ? [] : [getUsers],
      };
    });

  const getCalls = (method: string) => gated.calls.filter((call) => call.request.method === method);

  /** Renders the list with the mutation and answers the first list request */
  const renderPage = async (users: User[] = [{ id: 1, name: "Maciej" }]) => {
    const spies = { success: vi.fn(), error: vi.fn(), abort: vi.fn(), finished: vi.fn() };
    const view = renderHook(() => {
      const list = useFetch(getUsers, { dependencyTracking: false });
      const create = useSubmit(createUser, { dependencyTracking: false });
      create.onSubmitSuccess(spies.success);
      create.onSubmitError(spies.error);
      create.onSubmitAbort(spies.abort);
      create.onSubmitFinished(spies.finished);
      return { list, create };
    });
    await waitFor(() => {
      expect(getCalls("GET")).toHaveLength(1);
    });
    act(() => {
      getCalls("GET")[0].succeed(users);
    });
    await waitFor(() => {
      expect(view.result.current.list.data).toStrictEqual(users);
    });
    const getNames = () => (view.result.current.list.data ?? []).map((user) => user.name);
    return { ...view, spies, getNames };
  };

  const waitForPost = async (index: number) => {
    await waitFor(() => {
      expect(getCalls("POST").length).toBeGreaterThan(index);
    });
    return getCalls("POST")[index];
  };

  return { ...gated, getUsers, createUser, rollbackSpy, getCalls, renderPage, waitForPost };
};

/** Run the pending timers and promise callbacks - for the tests using fake timers */
const advance = async (time = 0) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(time);
  });
};

describe("useSubmit [ Optimistic cache ]", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when the submit starts", () => {
    it("should show the optimistic change in the list before the response comes", async () => {
      const { renderPage, waitForPost } = setup();
      const { result, getNames } = await renderPage();

      act(() => {
        result.current.create.submit({ payload: { name: "Kacper" } });
      });
      const call = await waitForPost(0);

      expect(call.settled).toBeFalse();
      expect(getNames()).toStrictEqual(["Maciej", "Kacper"]);
      expect(result.current.create.submitting).toBeTrue();
    });
    it("should not refetch the list when applying the optimistic change", async () => {
      const { renderPage, waitForPost, getCalls } = setup();
      const { result } = await renderPage();

      act(() => {
        result.current.create.submit({ payload: { name: "Kacper" } });
      });
      await waitForPost(0);

      expect(getCalls("GET")).toHaveLength(1);
    });
  });

  describe("when the submit succeeds", () => {
    it("should refetch the invalidated list once", async () => {
      const { renderPage, waitForPost, getCalls } = setup();
      const { result } = await renderPage();
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.create.submit({ payload: { name: "Kacper" } });
      });
      const call = await waitForPost(0);

      await act(async () => {
        call.succeed({ id: 2, name: "Kacper" });
        await promise;
      });

      await waitFor(() => {
        expect(getCalls("GET")).toHaveLength(2);
      });
      expect(getCalls("GET")[1].settled).toBeFalse();
    });
    it("should replace the optimistic item with the data from the server", async () => {
      const { renderPage, waitForPost, getCalls } = setup();
      const { result, getNames } = await renderPage();
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.create.submit({ payload: { name: "Kacper" } });
      });
      const call = await waitForPost(0);
      await act(async () => {
        call.succeed({ id: 2, name: "Kacper" });
        await promise;
      });
      await waitFor(() => {
        expect(getCalls("GET")).toHaveLength(2);
      });

      act(() => {
        getCalls("GET")[1].succeed([
          { id: 1, name: "Maciej" },
          { id: 2, name: "Kacper (saved)" },
        ]);
      });

      await waitFor(() => {
        expect(getNames()).toStrictEqual(["Maciej", "Kacper (saved)"]);
      });
      expect(result.current.list.data?.map((user) => user.id)).toStrictEqual([1, 2]);
    });
    it("should keep the optimistic item until the refetch is done", async () => {
      const { renderPage, waitForPost, getCalls } = setup();
      const { result, getNames } = await renderPage();
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.create.submit({ payload: { name: "Kacper" } });
      });
      const call = await waitForPost(0);

      await act(async () => {
        call.succeed({ id: 2, name: "Kacper" });
        await promise;
      });
      await waitFor(() => {
        expect(getCalls("GET")).toHaveLength(2);
      });

      expect(getNames()).toStrictEqual(["Maciej", "Kacper"]);
    });
    it("should not roll back", async () => {
      const { renderPage, waitForPost, rollbackSpy } = setup();
      const { result } = await renderPage();
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.create.submit({ payload: { name: "Kacper" } });
      });
      const call = await waitForPost(0);

      await act(async () => {
        call.succeed({ id: 2, name: "Kacper" });
        await promise;
      });

      expect(rollbackSpy).not.toHaveBeenCalled();
    });
    it("should pass the mutation context to the callbacks", async () => {
      const { renderPage, waitForPost } = setup();
      const { result, spies } = await renderPage();
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.create.submit({ payload: { name: "Kacper" } });
      });
      const call = await waitForPost(0);

      await act(async () => {
        call.succeed({ id: 2, name: "Kacper" });
        await promise;
      });

      const expectedContext = { optimisticUser: { id: -1, name: "Kacper" } };
      expect(spies.success.mock.calls[0][0].mutationContext).toStrictEqual(expectedContext);
      expect(spies.finished.mock.calls[0][0].mutationContext).toStrictEqual(expectedContext);
    });
    it("should not refetch anything when nothing is invalidated", async () => {
      vi.useFakeTimers();
      const { getCalls, getUsers, createUser } = setup({ invalidate: false });
      const { result } = renderHook(() => ({
        list: useFetch(getUsers, { dependencyTracking: false }),
        create: useSubmit(createUser, { dependencyTracking: false }),
      }));
      await advance();
      getCalls("GET")[0].succeed([{ id: 1, name: "Maciej" }]);
      await advance();

      act(() => {
        result.current.create.submit({ payload: { name: "Kacper" } });
      });
      await advance();
      getCalls("POST")[0].succeed({ id: 2, name: "Kacper" });
      await advance(1000);

      expect(getCalls("GET")).toHaveLength(1);
    });
  });

  describe("when the submit fails", () => {
    it("should roll the list back", async () => {
      const { renderPage, waitForPost, rollbackSpy } = setup();
      const { result, getNames } = await renderPage();
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.create.submit({ payload: { name: "Kacper" } });
      });
      const call = await waitForPost(0);
      expect(getNames()).toStrictEqual(["Maciej", "Kacper"]);

      await act(async () => {
        call.fail({ message: "Nope" }, 400);
        await promise;
      });

      await waitFor(() => {
        expect(getNames()).toStrictEqual(["Maciej"]);
      });
      expect(rollbackSpy).toHaveBeenCalledTimes(1);
    });
    it("should roll back before calling the error callback", async () => {
      const { renderPage, waitForPost, rollbackSpy } = setup();
      const { result, spies } = await renderPage();
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.create.submit({ payload: { name: "Kacper" } });
      });
      const call = await waitForPost(0);

      await act(async () => {
        call.fail({ message: "Nope" }, 400);
        await promise;
      });

      expect(spies.error).toHaveBeenCalledTimes(1);
      expect(rollbackSpy.mock.invocationCallOrder[0]).toBeLessThan(spies.error.mock.invocationCallOrder[0]);
      expect(spies.error.mock.calls[0][0].mutationContext).toStrictEqual({
        optimisticUser: { id: -1, name: "Kacper" },
      });
    });
    it("should not refetch the list", async () => {
      vi.useFakeTimers();
      const { getCalls, getUsers, createUser } = setup();
      const { result } = renderHook(() => ({
        list: useFetch(getUsers, { dependencyTracking: false }),
        create: useSubmit(createUser, { dependencyTracking: false }),
      }));
      await advance();
      getCalls("GET")[0].succeed([{ id: 1, name: "Maciej" }]);
      await advance();

      act(() => {
        result.current.create.submit({ payload: { name: "Kacper" } });
      });
      await advance();
      getCalls("POST")[0].fail({ message: "Nope" }, 400);
      await advance(1000);

      expect(getCalls("GET")).toHaveLength(1);
      expect(result.current.list.data).toStrictEqual([{ id: 1, name: "Maciej" }]);
    });
    it("should keep the optimistic change while the request waits for a retry", async () => {
      vi.useFakeTimers();
      const { getCalls, getUsers, createUser, rollbackSpy } = setup({ retry: 1, retryTime: 5000 });
      const { result } = renderHook(() => ({
        list: useFetch(getUsers, { dependencyTracking: false }),
        create: useSubmit(createUser, { dependencyTracking: false }),
      }));
      await advance();
      getCalls("GET")[0].succeed([{ id: 1, name: "Maciej" }]);
      await advance();
      act(() => {
        result.current.create.submit({ payload: { name: "Kacper" } });
      });
      await advance();

      getCalls("POST")[0].fail({ message: "Temporary" }, 503);
      await advance();

      expect(rollbackSpy).not.toHaveBeenCalled();
      expect(result.current.list.data?.map((user) => user.name)).toStrictEqual(["Maciej", "Kacper"]);
    });
    it("should roll back after the last retry fails", async () => {
      vi.useFakeTimers();
      const { getCalls, getUsers, createUser, rollbackSpy } = setup({ retry: 1, retryTime: 5000 });
      const { result } = renderHook(() => ({
        list: useFetch(getUsers, { dependencyTracking: false }),
        create: useSubmit(createUser, { dependencyTracking: false }),
      }));
      await advance();
      getCalls("GET")[0].succeed([{ id: 1, name: "Maciej" }]);
      await advance();
      act(() => {
        result.current.create.submit({ payload: { name: "Kacper" } });
      });
      await advance();
      getCalls("POST")[0].fail({ message: "Temporary" }, 503);
      await advance(5000);

      getCalls("POST")[1].fail({ message: "Still down" }, 503);
      await advance();

      expect(rollbackSpy).toHaveBeenCalledTimes(1);
      expect(result.current.list.data?.map((user) => user.name)).toStrictEqual(["Maciej"]);
    });
    it("should run the optimistic callback once for a retried request", async () => {
      vi.useFakeTimers();
      const { getCalls, getUsers, createUser } = setup({ retry: 1, retryTime: 5000 });
      const { result } = renderHook(() => ({
        list: useFetch(getUsers, { dependencyTracking: false }),
        create: useSubmit(createUser, { dependencyTracking: false }),
      }));
      await advance();
      getCalls("GET")[0].succeed([{ id: 1, name: "Maciej" }]);
      await advance();
      act(() => {
        result.current.create.submit({ payload: { name: "Kacper" } });
      });
      await advance();
      getCalls("POST")[0].fail({ message: "Temporary" }, 503);
      await advance(5000);

      expect(getCalls("POST")).toHaveLength(2);
      expect(result.current.list.data?.map((user) => user.name)).toStrictEqual(["Maciej", "Kacper"]);
    });
  });

  describe("when the submit gets aborted", () => {
    it("should roll the list back after abort()", async () => {
      const { renderPage, waitForPost, rollbackSpy } = setup();
      const { result, getNames } = await renderPage();
      act(() => {
        result.current.create.submit({ payload: { name: "Kacper" } });
      });
      await waitForPost(0);
      expect(getNames()).toStrictEqual(["Maciej", "Kacper"]);

      act(() => {
        result.current.create.abort();
      });

      await waitFor(() => {
        expect(getNames()).toStrictEqual(["Maciej"]);
      });
      expect(rollbackSpy).toHaveBeenCalledTimes(1);
    });
    it("should roll back the request replaced by a newer cancelable submit", async () => {
      const { renderPage, waitForPost, rollbackSpy } = setup({ cancelable: true });
      const { result, getNames, spies } = await renderPage();
      act(() => {
        result.current.create.submit({ payload: { name: "Kacper" } });
      });
      await waitForPost(0);

      act(() => {
        result.current.create.submit({ payload: { name: "Albert" } });
      });
      await waitForPost(1);

      await waitFor(() => {
        expect(spies.abort).toHaveBeenCalledTimes(1);
      });
      expect(rollbackSpy).toHaveBeenCalledTimes(1);
      expect(rollbackSpy).toHaveBeenCalledWith("Kacper");
      expect(getNames()).toStrictEqual(["Maciej", "Albert"]);
      expect(spies.abort.mock.calls[0][0].mutationContext).toStrictEqual({
        optimisticUser: { id: -1, name: "Kacper" },
      });
    });
  });

  describe("when two optimistic submits overlap", () => {
    it("should show both optimistic changes", async () => {
      const { renderPage, waitForPost } = setup();
      const { result, getNames } = await renderPage();

      act(() => {
        result.current.create.submit({ payload: { name: "Kacper" } });
        result.current.create.submit({ payload: { name: "Albert" } });
      });
      await waitForPost(1);

      expect(getNames()).toStrictEqual(["Maciej", "Kacper", "Albert"]);
    });
    it("should roll back only the failed one", async () => {
      const { renderPage, waitForPost, rollbackSpy } = setup({ invalidate: false });
      const { result, getNames } = await renderPage();
      let promises: Promise<unknown>[] = [];
      act(() => {
        promises = ["Kacper", "Albert"].map((name) => result.current.create.submit({ payload: { name } }));
      });
      await waitForPost(1);
      const kacperCall = await waitForPost(0);

      await act(async () => {
        kacperCall.fail({ message: "Nope" }, 400);
        await promises[0];
      });

      await waitFor(() => {
        expect(getNames()).toStrictEqual(["Maciej", "Albert"]);
      });
      expect(rollbackSpy).toHaveBeenCalledTimes(1);
      expect(rollbackSpy).toHaveBeenCalledWith("Kacper");
    });
    it("should restore the original list when both fail", async () => {
      const { renderPage, waitForPost, rollbackSpy } = setup({ invalidate: false });
      const { result, getNames } = await renderPage();
      let promises: Promise<unknown>[] = [];
      act(() => {
        promises = ["Kacper", "Albert"].map((name) => result.current.create.submit({ payload: { name } }));
      });
      const albertCall = await waitForPost(1);
      const kacperCall = await waitForPost(0);

      await act(async () => {
        albertCall.fail({ message: "Nope" }, 400);
        kacperCall.fail({ message: "Nope" }, 400);
        await Promise.all(promises);
      });

      await waitFor(() => {
        expect(getNames()).toStrictEqual(["Maciej"]);
      });
      expect(rollbackSpy).toHaveBeenCalledTimes(2);
    });
    it("should give every submit its own mutation context", async () => {
      const { renderPage, waitForPost } = setup({ invalidate: false });
      const { result, spies } = await renderPage();
      let promises: Promise<unknown>[] = [];
      act(() => {
        promises = ["Kacper", "Albert"].map((name) => result.current.create.submit({ payload: { name } }));
      });
      const albertCall = await waitForPost(1);
      const kacperCall = await waitForPost(0);

      await act(async () => {
        kacperCall.succeed({ id: 2, name: "Kacper" });
        albertCall.fail({ message: "Nope" }, 400);
        await Promise.all(promises);
      });

      expect(spies.success.mock.calls[0][0].mutationContext.optimisticUser.name).toBe("Kacper");
      expect(spies.error.mock.calls[0][0].mutationContext.optimisticUser.name).toBe("Albert");
    });
  });

  describe("when the cache is updated by hand", () => {
    it("should refetch the list once when the success callback invalidates it", async () => {
      const { client, getUsers, getCalls } = setup();
      const renameUser = client.createRequest<{ response: User; payload: { name: string } }>()({
        endpoint: "/users/:userId",
        method: "PATCH",
      });
      const { result } = renderHook(() => {
        const list = useFetch(getUsers, { dependencyTracking: false });
        const rename = useSubmit(renameUser, { dependencyTracking: false });
        rename.onSubmitSuccess(() => {
          client.cache.invalidate(getUsers);
        });
        return { list, rename };
      });
      await waitFor(() => {
        expect(getCalls("GET")).toHaveLength(1);
      });
      act(() => {
        getCalls("GET")[0].succeed([{ id: 1, name: "Maciej" }]);
      });
      await waitFor(() => {
        expect(result.current.list.data).toStrictEqual([{ id: 1, name: "Maciej" }]);
      });

      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.rename.submit({ payload: { name: "Maciek" }, params: { userId: 1 } });
      });
      await waitFor(() => {
        expect(getCalls("PATCH")).toHaveLength(1);
      });
      await act(async () => {
        getCalls("PATCH")[0].succeed({ id: 1, name: "Maciek" });
        await promise;
      });
      await waitFor(() => {
        expect(getCalls("GET")).toHaveLength(2);
      });
      act(() => {
        getCalls("GET")[1].succeed([{ id: 1, name: "Maciek" }]);
      });

      await waitFor(() => {
        expect(result.current.list.data).toStrictEqual([{ id: 1, name: "Maciek" }]);
      });
      expect(getCalls("GET")).toHaveLength(2);
    });
    it("should show the response written to the list cache without a refetch", async () => {
      const { client, getUsers, getCalls } = setup();
      const renameUser = client.createRequest<{ response: User; payload: { name: string } }>()({
        endpoint: "/users/:userId",
        method: "PATCH",
      });
      const { result } = renderHook(() => {
        const list = useFetch(getUsers, { dependencyTracking: false });
        const rename = useSubmit(renameUser, { dependencyTracking: false });
        rename.onSubmitSuccess(({ response }) => {
          client.cache.update(getUsers, (previous) => ({
            data: (previous?.data ?? []).map((user) => (user.id === response.data.id ? response.data : user)),
          }));
        });
        return { list, rename };
      });
      await waitFor(() => {
        expect(getCalls("GET")).toHaveLength(1);
      });
      act(() => {
        getCalls("GET")[0].succeed([
          { id: 1, name: "Maciej" },
          { id: 2, name: "Kacper" },
        ]);
      });
      await waitFor(() => {
        expect(result.current.list.data).toHaveLength(2);
      });

      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.rename.submit({ payload: { name: "Maciek" }, params: { userId: 1 } });
      });
      await waitFor(() => {
        expect(getCalls("PATCH")).toHaveLength(1);
      });
      await act(async () => {
        getCalls("PATCH")[0].succeed({ id: 1, name: "Maciek" });
        await promise;
      });

      await waitFor(() => {
        expect(result.current.list.data).toStrictEqual([
          { id: 1, name: "Maciek" },
          { id: 2, name: "Kacper" },
        ]);
      });
      expect(getCalls("GET")).toHaveLength(1);
    });
    it("should invalidate the cache of its own request with refetch()", async () => {
      const { client, createUser } = setup();
      const invalidateSpy = vi.spyOn(client.cache, "invalidate");
      const { result } = renderHook(() => useSubmit(createUser, { dependencyTracking: false }));

      act(() => {
        result.current.refetch();
      });

      expect(invalidateSpy).toHaveBeenCalledTimes(1);
      expect(invalidateSpy).toHaveBeenCalledWith(createUser);
    });
    it("should invalidate the request from the latest render with refetch()", async () => {
      const { client } = setup();
      const renameUser = client.createRequest<{ response: User }>()({ endpoint: "/users/:userId", method: "PATCH" });
      const invalidateSpy = vi.spyOn(client.cache, "invalidate");
      const { result, rerender } = renderHook(
        ({ userId }: { userId: number }) => useSubmit(renameUser.setParams({ userId }), { dependencyTracking: false }),
        { initialProps: { userId: 1 } },
      );
      const initialRefetch = result.current.refetch;

      rerender({ userId: 2 });
      act(() => {
        initialRefetch();
      });

      expect((invalidateSpy.mock.calls[0][0] as typeof renameUser).endpoint).toBe("/users/2");
    });
  });
});
