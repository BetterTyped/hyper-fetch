import type { CacheAsyncStorageType, CacheValueType } from "@hyper-fetch/core";
import { Cache, Client } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { renderHook, waitFor } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";
import { StrictMode } from "react";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

type User = { id: number; name: string };

/** Async persistent storage, like IndexedDB - every read resolves after the current task */
const createLazyStorage = () => {
  const store = new Map<string, CacheValueType>();
  const nextTask = () =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

  const storage: CacheAsyncStorageType = {
    set: async (key, data) => {
      store.set(key, data as CacheValueType);
    },
    get: async (key) => {
      await nextTask();
      return store.get(key) as never;
    },
    keys: async () => [...store.keys()],
    delete: async (key) => {
      store.delete(key);
    },
    clear: async () => {
      store.clear();
    },
  };
  return { storage, store };
};

describe("useFetch [ Lazy storage ]", () => {
  let lazy = createLazyStorage();

  const createAppClient = () =>
    new Client({ url: "http://lazy.test", cache: () => new Cache({ lazyStorage: lazy.storage }) });
  const createUserRequest = (client: Client, staleTime = 60_000) =>
    client.createRequest<{ response: User }>()({ endpoint: "/users/1", staleTime });

  /** Previous session - the response was saved to the lazy storage */
  const persistUser = async (user: User, staleTime?: number) => {
    const previousClient = createAppClient();
    const request = createUserRequest(previousClient, staleTime);
    mockRequest(request, { data: user, delay: 0 });
    await request.send();
    await waitFor(() => {
      expect(lazy.store.size).toBe(1);
    });
    resetMocks();
  };

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    lazy = createLazyStorage();
    resetMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should not fetch on mount when the lazy storage holds fresh data", async () => {
    await persistUser({ id: 1, name: "Persisted" });
    const client = createAppClient();
    const request = createUserRequest(client);
    mockRequest(request, { data: { id: 1, name: "Network" }, delay: 0 });
    const fetchSpy = vi.spyOn(client.adapter, "fetch");

    const { result } = renderHook(() => useFetch(request, { revalidate: false }));

    await waitFor(() => {
      expect(result.current.data).toStrictEqual({ id: 1, name: "Persisted" });
    });
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.loading).toBeFalse();
  });

  it("should fetch once when the lazy storage holds stale data", async () => {
    await persistUser({ id: 1, name: "Persisted" }, 1);
    await new Promise((resolve) => {
      setTimeout(resolve, 5);
    });
    const client = createAppClient();
    const request = createUserRequest(client, 1);
    mockRequest(request, { data: { id: 1, name: "Network" }, delay: 0 });
    const fetchSpy = vi.spyOn(client.adapter, "fetch");

    const { result } = renderHook(() => useFetch(request, { revalidate: false }));

    await waitFor(() => {
      expect(result.current.data).toStrictEqual({ id: 1, name: "Network" });
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("should fetch once when the lazy storage has no data", async () => {
    const client = createAppClient();
    const request = createUserRequest(client);
    mockRequest(request, { data: { id: 1, name: "Network" }, delay: 0 });
    const fetchSpy = vi.spyOn(client.adapter, "fetch");

    const { result } = renderHook(() => useFetch(request, { revalidate: false }));

    await waitFor(() => {
      expect(result.current.data).toStrictEqual({ id: 1, name: "Network" });
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("should not fetch when the component unmounts during the lazy read", async () => {
    const client = createAppClient();
    const request = createUserRequest(client);
    const fetchSpy = vi.spyOn(client.adapter, "fetch");

    const { unmount } = renderHook(() => useFetch(request, { revalidate: false }));
    unmount();
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("should fetch once in StrictMode when the lazy storage has no data", async () => {
    const client = createAppClient();
    const request = createUserRequest(client);
    mockRequest(request, { data: { id: 1, name: "Network" }, delay: 0 });
    const fetchSpy = vi.spyOn(client.adapter, "fetch");

    const { result } = renderHook(() => useFetch(request, { revalidate: false }), { wrapper: StrictMode });

    await waitFor(() => {
      expect(result.current.data).toStrictEqual({ id: 1, name: "Network" });
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("should not fetch in StrictMode when the lazy storage holds fresh data", async () => {
    await persistUser({ id: 1, name: "Persisted" });
    const client = createAppClient();
    const request = createUserRequest(client);
    const fetchSpy = vi.spyOn(client.adapter, "fetch");

    const { result } = renderHook(() => useFetch(request, { revalidate: false }), { wrapper: StrictMode });

    await waitFor(() => {
      expect(result.current.data).toStrictEqual({ id: 1, name: "Persisted" });
    });
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("should fetch right away with revalidate", async () => {
    await persistUser({ id: 1, name: "Persisted" });
    const client = createAppClient();
    const request = createUserRequest(client);
    mockRequest(request, { data: { id: 1, name: "Network" }, delay: 0 });
    const fetchSpy = vi.spyOn(client.adapter, "fetch");

    renderHook(() => useFetch(request));

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
