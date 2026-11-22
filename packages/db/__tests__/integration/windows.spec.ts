import { collection, createDb, gt, rowType } from "@hyper-fetch/db";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { createApi, createHttpClient } from "../utils/fixtures";

const { server, startServer, stopServer, resetMocks } = createHttpMockingServer();

type Item = { id: number; group: number; score: number | null; name: string };

const item = (id: number, overrides: Partial<Item> = {}): Item => ({
  id,
  group: 1,
  score: id * 10,
  name: `Item ${id}`,
  ...overrides,
});

const setup = (items: Item[]) => {
  const client = createHttpClient();
  const api = createApi(server);
  const getItems = client.createRequest<{ response: Item[] }>()({ endpoint: "/items" });
  const saveItem = client.createRequest<{ response: Item; payload: Item }>()({ endpoint: "/items", method: "PUT" });
  const deleteItem = client.createRequest<{ response: null }>()({ endpoint: "/items/:id", method: "DELETE" });
  const Items = collection(rowType<Item>(), { key: "id" })
    .load(getItems)
    .ingest(saveItem)
    .mutate({ delete: { request: deleteItem, map: (id) => ({ params: { id } }), onSuccess: "keep" } });
  api.get("/items", () => ({ data: items }));
  api.put("/items", ({ body }) => ({ data: body }));
  api.delete("/items/:id", () => ({ data: null }));
  const db = createDb({ item: Items });
  const save = (row: Item) => saveItem.setPayload(row).send();
  return { db, save };
};

const ids = (items: { id: number }[] | undefined) => items?.map((row) => row.id);

describe("db [ Windows and ordering ]", () => {
  beforeAll(() => startServer());
  beforeEach(() => resetMocks());
  afterAll(() => stopServer());

  const open = async (
    db: ReturnType<typeof setup>["db"],
    build: (query: ReturnType<typeof setup>["db"]["item"]) => any,
  ) => {
    const query = build(db.item);
    const unsubscribe = query.subscribe(() => {});
    await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
    return { query, unsubscribe };
  };

  it("keeps a limited window in step with inserts before, inside and after it", async () => {
    const { db, save } = setup([1, 2, 3, 4].map((id) => item(id)));
    const { query, unsubscribe } = await open(db, (items) => items.orderBy((row) => row.score).limit(3));
    expect(ids(query.getSnapshot().data)).toStrictEqual([1, 2, 3]);

    await save(item(0, { score: 0 }));
    expect(ids(query.getSnapshot().data)).toStrictEqual([0, 1, 2]);
    await save(item(5, { score: 15 }));
    expect(ids(query.getSnapshot().data)).toStrictEqual([0, 1, 5]);

    // An insert after the window changes nothing, and the result keeps its identity
    const before = query.getSnapshot().data;
    await save(item(9, { score: 90 }));
    expect(query.getSnapshot().data).toBe(before);
    unsubscribe();
  });

  it("backfills the window when a row inside it is deleted or moves out, and ignores deletes outside", async () => {
    const { db, save } = setup([1, 2, 3, 4, 5].map((id) => item(id)));
    const { query, unsubscribe } = await open(db, (items) => items.orderBy((row) => row.score).limit(3));

    await db.item.delete(2);
    expect(ids(query.getSnapshot().data)).toStrictEqual([1, 3, 4]);
    const before = query.getSnapshot().data;
    await db.item.delete(5);
    expect(query.getSnapshot().data).toBe(before);

    await save(item(1, { score: 100 }));
    expect(ids(query.getSnapshot().data)).toStrictEqual([3, 4, 1]);
    unsubscribe();
  });

  it("fills a window that is not full, and handles an empty collection, a large limit and limit 0", async () => {
    const { db, save } = setup([]);
    const { query, unsubscribe } = await open(db, (items) => items.orderBy((row) => row.score).limit(2));
    expect(query.getSnapshot().data).toStrictEqual([]);
    await save(item(1));
    expect(ids(query.getSnapshot().data)).toStrictEqual([1]);

    const large = await open(db, (items) => items.orderBy((row) => row.id).limit(50));
    expect(ids(large.query.getSnapshot().data)).toStrictEqual([1]);
    const none = await open(db, (items) => items.orderBy((row) => row.id).limit(0));
    expect(none.query.getSnapshot().data).toStrictEqual([]);
    [unsubscribe, large.unsubscribe, none.unsubscribe].forEach((stop) => stop());
  });

  it("breaks ties by key, stably across updates and a delete followed by a reinsert", async () => {
    const { db, save } = setup([3, 1, 2].map((id) => item(id, { score: 5 })));
    const { query, unsubscribe } = await open(db, (items) => items.orderBy((row) => row.score));
    expect(ids(query.getSnapshot().data)).toStrictEqual([1, 2, 3]);
    await save(item(2, { score: 5, name: "Renamed" }));
    expect(ids(query.getSnapshot().data)).toStrictEqual([1, 2, 3]);
    await db.item.delete(1);
    await save(item(1, { score: 5 }));
    expect(ids(query.getSnapshot().data)).toStrictEqual([1, 2, 3]);
    unsubscribe();
  });

  it("puts empty values first ascending and last descending, ties broken by key", async () => {
    const { db } = setup([
      item(1, { score: 10 }),
      item(2, { score: null }),
      item(3, { score: -5 }),
      item(4, { score: null }),
    ]);
    const asc = await open(db, (items) => items.orderBy((row) => row.score));
    const desc = await open(db, (items) => items.orderBy((row) => row.score, "desc"));
    expect(ids(asc.query.getSnapshot().data)).toStrictEqual([2, 4, 3, 1]);
    expect(ids(desc.query.getSnapshot().data)).toStrictEqual([1, 3, 2, 4]);
    asc.unsubscribe();
    desc.unsubscribe();
  });

  it("sorts by several fields in mixed directions and moves a row when its sort field changes", async () => {
    const { db, save } = setup([
      item(1, { group: 2, score: 10 }),
      item(2, { group: 1, score: 10 }),
      item(3, { group: 1, score: 30 }),
      item(4, { group: 2, score: 40 }),
    ]);
    const { query, unsubscribe } = await open(db, (items) =>
      items.orderBy((row) => row.group).orderBy((row) => row.score, "desc"),
    );
    expect(ids(query.getSnapshot().data)).toStrictEqual([3, 2, 4, 1]);
    await save(item(1, { group: 1, score: 20 }));
    expect(ids(query.getSnapshot().data)).toStrictEqual([3, 1, 2, 4]);
    // Insert, update and delete in a row
    await save(item(5, { group: 2, score: 50 }));
    await save(item(5, { group: 1, score: 5 }));
    expect(ids(query.getSnapshot().data)).toStrictEqual([3, 1, 2, 5, 4]);
    await db.item.delete(5);
    expect(ids(query.getSnapshot().data)).toStrictEqual([3, 1, 2, 4]);
    unsubscribe();
  });

  it("orders ingested responses by when their requests were sent, not when they arrived", async () => {
    const client = createHttpClient();
    const api = createApi(server);
    const saveItem = client.createRequest<{ response: Item; payload: Item }>()({ endpoint: "/slow", method: "PUT" });
    const db = createDb({ item: collection(rowType<Item>(), { key: "id" }).ingest(saveItem) });
    const release = { first: () => {} };
    api.put("/slow", async ({ body }) => {
      if ((body as Item).name === "Sent first") {
        await new Promise<void>((resolve) => {
          release.first = resolve;
        });
      }
      return { data: body };
    });
    const first = saveItem.setPayload(item(1, { name: "Sent first" })).send();
    await vi.waitFor(() => expect(api.callsTo("/slow", "put")).toHaveLength(1));
    await saveItem.setPayload(item(1, { name: "Sent second" })).send();
    release.first();
    await first;
    expect(db.item.findOne(1).local().getSnapshot().data?.name).toBe("Sent second");
    db.destroy();

    // A request sent before the db existed counts from when its response arrives
    const early = saveItem.setPayload(item(2, { name: "Sent first" })).send();
    await vi.waitFor(() => expect(api.callsTo("/slow", "put")).toHaveLength(3));
    const later = createDb({ item: collection(rowType<Item>(), { key: "id" }).ingest(saveItem) });
    release.first();
    await early;
    expect(later.item.findOne(2).local().getSnapshot().data?.name).toBe("Sent first");
    later.destroy();
  });

  it("adds and removes rows that a change moves into or out of a filter", async () => {
    const { db, save } = setup([1, 2].map((id) => item(id)));
    const { query, unsubscribe } = await open(db, (items) =>
      items.where((row) => gt(row.score, 15)).orderBy((row) => row.id),
    );
    expect(ids(query.getSnapshot().data)).toStrictEqual([2]);
    await save(item(1, { score: 50 }));
    expect(ids(query.getSnapshot().data)).toStrictEqual([1, 2]);
    await save(item(2, { score: 0 }));
    expect(ids(query.getSnapshot().data)).toStrictEqual([1]);
    unsubscribe();
  });
});
