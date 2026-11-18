import { Client, getPageRequest } from "@hyper-fetch/core";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useInfiniteFetch } from "hooks/use-infinite-fetch";

import type { ListBackend } from "../../utils/use-infinite-fetch.modes";
import { createListBackend, pagingModes } from "../../utils/use-infinite-fetch.modes";
import { baseUrl, createListServer, settleRequests, sleep } from "../../utils/use-infinite-fetch.utils";

const server = createListServer();
const { startServer, stopServer, resetMocks, resetCalls } = server;

const seeds = [1, 7, 42, 1234, 99_991];
const steps = 30;

// Failing seeds can be replayed: the same seed always produces the same actions
const createRandom = (seed: number) => {
  let value = seed;
  return () => {
    value = (value * 16_807) % 2_147_483_647;
    return value / 2_147_483_647;
  };
};

describe.each(pagingModes)("useInfiniteFetch [ Random ] $name", (mode) => {
  let client: Client;
  let backend: ListBackend;

  const options = { pagination: mode.pagination, dependencyTracking: false };
  const mount = () => renderHook(() => useInfiniteFetch(mode.create(client), options) as any);

  beforeAll(() => startServer());
  afterAll(() => stopServer());

  beforeEach(() => {
    client = new Client({ url: baseUrl });
    backend = createListBackend();
    backend.total = 12;
    resetCalls();
    mode.mock(server, backend);
  });

  afterEach(async () => {
    await settleRequests(client);
    resetMocks();
  });

  it.each(seeds)("should end up matching the server for seed %s", async (seed) => {
    const random = createRandom(seed);
    const pick = (size: number) => Math.floor(random() * size);
    const pending: Promise<unknown>[] = [];
    let view = mount();

    const actions: VoidFunction[] = [
      () => pending.push(view.result.current.fetchNextPage()),
      () => pending.push(view.result.current.fetchNextPage()),
      () => pending.push(view.result.current.fetchPreviousPage()),
      () => pending.push(view.result.current.refetch()),
      () => pending.push(view.result.current.reset()),
      () => view.result.current.abort(),
      () => {
        backend.version += 1;
      },
      () => {
        backend.failing.add(pick(6) * 2);
      },
      () => backend.failing.clear(),
      () => {
        const { pageParams } = view.result.current;
        if (pageParams.length > 0) {
          const param = pageParams[pick(pageParams.length)];
          client.cache.invalidate(getPageRequest(mode.create(client), mode.pagination, param));
        }
      },
      () => {
        view.unmount();
        view = mount();
      },
    ];

    for (let step = 0; step < steps; step += 1) {
      const count = 1 + pick(3);
      for (let index = 0; index < count; index += 1) {
        // Nothing is awaited in between, so the actions overlap each other
        act(() => actions[pick(actions.length)]());
      }
      // Some actions overlap the responses of the previous ones, some wait for them
      // eslint-disable-next-line no-await-in-loop, @typescript-eslint/no-loop-func
      await act(async () => {
        await sleep(pick(12));
      });
    }

    backend.failing.clear();
    await act(async () => {
      await Promise.all(pending);
    });
    await act(() => view.result.current.refetch());
    await waitFor(() => expect(view.result.current.isFetching).toBe(false));

    const { items, pageParams, error, hasNextPage, hasPreviousPage } = view.result.current;
    const ids: number[] = items.map((item: { id: number }) => item.id);

    expect(error).toBeNull();
    expect(ids.length).toBeGreaterThan(0);
    // Whole pages, in order, without gaps or repeated items
    expect((ids[0] - 1) % 2).toBe(0);
    expect(ids.length % 2).toBe(0);
    ids.forEach((id, index) => {
      expect(id).toBe(ids[0] + index);
    });
    expect(new Set(pageParams.map(String)).size).toBe(pageParams.length);
    // Everything on screen comes from the latest state of the server
    items.forEach((item: { version: number }) => {
      expect(item.version).toBe(backend.version);
    });
    expect(hasNextPage).toBe((ids.at(-1) as number) < backend.total);
    expect(hasPreviousPage).toBe(ids[0] > 1);
    // Nothing is left behind
    expect(client.fetchDispatcher.getAllRunningRequests()).toHaveLength(0);
  });
});
