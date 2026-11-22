/* oxlint-disable no-await-in-loop -- the steps of a model run one after another by design */
/**
 * A model test for infinite lists over a cursor backend: random page loads, rows the server gains and loses, client
 * inserts and deletes, and refetches. At every step the window holds no duplicate and stays in order; after a final
 * refetch it is exactly the first rows of the server's order. Seeds are fixed, so failures replay.
 */
import { collection, createDb, rowType } from "@hyper-fetch/db";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { createApi, createHttpClient, flush } from "../utils/fixtures";
import { createRandom } from "../utils/random";

const { server, startServer, stopServer, resetMocks } = createHttpMockingServer();

type Item = { id: number; rank: number };

const byRank = (left: Item, right: Item) => left.rank - right.rank || left.id - right.id;

const runSeed = async (seed: number) => {
  const random = createRandom(seed);
  const client = createHttpClient();
  const api = createApi(server);
  const backendPage = random.int(1, 3);
  const pageSize = random.int(1, 4);
  const getItems = client.createRequest<{
    response: { items: Item[]; next: string | null };
    queryParams?: { cursor?: string; sort?: string };
  }>()({ endpoint: "/ranked" });
  const createItem = client.createRequest<{ response: Item; payload: Item }>()({ endpoint: "/ranked", method: "POST" });
  const deleteItem = client.createRequest<{ response: null }>()({ endpoint: "/ranked/:id", method: "DELETE" });
  const Items = collection(rowType<Item>(), { key: "id" })
    .load(getItems, {
      rows: (response) => response.items,
      cursor: (response) => response.next,
      page: (cursor) => ({ queryParams: { cursor } }),
      orderBy: { rank: (direction) => ({ queryParams: { sort: direction } }) },
    })
    .mutate({
      insert: { request: createItem, map: (row) => ({ payload: row }) },
      delete: { request: deleteItem, map: (id) => ({ params: { id } }), onSuccess: "keep" },
    });
  const db = createDb({ item: Items });

  const table = new Map<number, Item>();
  let nextId = 1;
  const add = () => {
    const item = { id: nextId, rank: random.int(0, 20) };
    nextId += 1;
    table.set(item.id, item);
    return item;
  };
  Array.from({ length: random.int(0, 9) }, add);

  // Keyset cursors, as real APIs use: the rank and id of the last row sent
  api.get("/ranked", ({ url }) => {
    const sorted = [...table.values()].toSorted(byRank);
    const cursor = url.searchParams.get("cursor");
    const [rank, id] = cursor ? cursor.split(":").map(Number) : [-Infinity, -Infinity];
    const rest = sorted.filter((item) => item.rank > rank || (item.rank === rank && item.id > id));
    const items = rest.slice(0, backendPage);
    const last = items.at(-1);
    return { data: { items, next: rest.length > items.length && last ? `${last.rank}:${last.id}` : null } };
  });
  api.post("/ranked", ({ body }) => {
    table.set((body as Item).id, body as Item);
    return { data: body };
  });
  api.delete("/ranked/:id", ({ params }) => {
    table.delete(Number(params.id));
    return { data: null };
  });

  const feed = db.item.orderBy((row) => row.rank).infinite({ pageSize });
  const unsubscribe = feed.subscribe(() => {});
  const log: string[] = [`backend page ${backendPage}, page size ${pageSize}, rows ${table.size}`];
  const settle = async () => {
    await vi.waitFor(() => expect(feed.getSnapshot().isFetchingNextPage || feed.getSnapshot().isFetching).toBeFalse());
    await flush(2);
  };
  await settle();

  const checkWindow = () => {
    const data = feed.getSnapshot().data ?? [];
    const context = `seed ${seed}:\n${log.join("\n")}`;
    expect(new Set(data.map((item) => item.id)).size, `${context}\nduplicates`).toBe(data.length);
    expect(data, `${context}\norder`).toStrictEqual(data.toSorted(byRank));
    expect(data.length, `${context}\nwindow`).toBeLessThanOrEqual(feed.getSnapshot().pages.length * pageSize);
  };

  for (let step = 0; step < 20; step += 1) {
    const action = random.int(0, 9);
    if (action <= 2) {
      log.push("fetch next page");
      await feed.fetchNextPage();
    } else if (action === 3) {
      log.push("server gains a row");
      add();
    } else if (action === 4 && table.size > 0) {
      const id = [...table.keys()][random.int(0, table.size - 1)];
      log.push(`server loses ${id}`);
      table.delete(id);
    } else if (action === 5) {
      const item = { id: nextId, rank: random.int(0, 20) };
      nextId += 1;
      log.push(`client inserts ${JSON.stringify(item)}`);
      await db.item.insert(item);
    } else if (action === 6) {
      const shown = feed.getSnapshot().data ?? [];
      if (shown.length > 0) {
        const { id } = shown[random.int(0, shown.length - 1)];
        log.push(`client deletes ${id}`);
        await db.item.delete(id);
      }
    } else {
      log.push("refetch");
      await feed.refetch();
    }
    await settle();
    checkWindow();
  }

  await feed.refetch();
  await settle();
  const snapshot = feed.getSnapshot();
  const sorted = [...table.values()].toSorted(byRank);
  const context = `seed ${seed}:\n${log.join("\n")}\nfinal`;
  expect(snapshot.data, context).toStrictEqual(sorted.slice(0, snapshot.data?.length ?? 0));
  // The window is full unless the server has no more rows
  expect(snapshot.data?.length, context).toBe(Math.min(sorted.length, snapshot.pages.length * pageSize));
  unsubscribe();
  db.destroy();
};

describe("db [ Model ] infinite lists over a cursor backend", () => {
  beforeAll(() => startServer());
  beforeEach(() => resetMocks());
  afterAll(() => stopServer());

  it.each(Array.from({ length: 60 }, (_, index) => index + 1))("seed %i", async (seed) => {
    await runSeed(seed);
  });
});
