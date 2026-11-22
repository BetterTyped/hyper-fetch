/* oxlint-disable no-await-in-loop -- the steps of a model run one after another by design */
/**
 * A model test for races: random optimistic writes, changes made on the server by someone else and refetches, with
 * every response held and released in a random order. Whatever the order, once everything settles the client shows
 * exactly the server's rows, holds no pending layers, and every write resolved. Seeds are fixed, so failures replay.
 */
import { collection, createDb, eq, rowType } from "@hyper-fetch/db";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { createApi, createHttpClient, flush } from "../utils/fixtures";
import { createRandom } from "../utils/random";

const { server, startServer, stopServer, resetMocks } = createHttpMockingServer();

type Item = { id: number; group: number; title: string; version: number };

const setup = (useVersion: boolean) => {
  const client = createHttpClient();
  const api = createApi(server);
  const getItems = client.createRequest<{ response: Item[] }>()({ endpoint: "/groups/:group/items" });
  const createItem = client.createRequest<{ response: Item; payload: Item }>()({ endpoint: "/items", method: "POST" });
  const updateItem = client.createRequest<{ response: Item; payload: Partial<Item> }>()({
    endpoint: "/items/:id",
    method: "PATCH",
  });
  const deleteItem = client.createRequest<{ response: null }>()({ endpoint: "/items/:id", method: "DELETE" });
  const Items = collection(rowType<Item>(), { key: "id", ...(useVersion ? { version: "version" as const } : {}) })
    .load(getItems, { where: { group: { eq: (group) => ({ params: { group } }), required: true } } })
    .mutate({
      insert: { request: createItem, map: (row) => ({ payload: row }) },
      update: { request: updateItem, map: (id, changes) => ({ params: { id }, payload: changes }) },
      delete: { request: deleteItem, map: (id) => ({ params: { id } }), onSuccess: "keep" },
    });
  const db = createDb({ item: Items });
  return { api, db };
};

const runSeed = async (seed: number, useVersion: boolean) => {
  const random = createRandom(seed);
  const { api, db } = setup(useVersion);
  const table = new Map<number, Item>();
  [1, 2, 3].forEach((id) => table.set(id, { id, group: 1, title: `t${id}`, version: 1 }));
  const held: { release: () => void }[] = [];
  let holding = true;
  /** Holds a response until the test releases it, then answers from the table as it is at that moment */
  const hold = <T>(answer: () => T) =>
    holding
      ? new Promise<T>((resolve) => {
          held.push({ release: () => resolve(answer()) });
        })
      : Promise.resolve(answer());

  api.get("/groups/:group/items", ({ params }) =>
    hold(() => ({ data: [...table.values()].filter((row) => row.group === Number(params.group)) })),
  );
  api.post("/items", ({ body }) =>
    hold(() => {
      const row = body as Item;
      if (table.has(row.id)) {
        return { status: 409, data: { message: "Exists" } };
      }
      const created = { ...row, version: 1 };
      table.set(row.id, created);
      return { data: created };
    }),
  );
  api.patch("/items/:id", ({ params, body }) =>
    hold(() => {
      const current = table.get(Number(params.id));
      if (!current) {
        return { status: 404, data: { message: "Gone" } };
      }
      const next = { ...current, ...(body as Partial<Item>), version: current.version + 1 };
      table.set(next.id, next);
      return { data: next };
    }),
  );
  api.delete("/items/:id", ({ params }) =>
    hold(() => {
      table.delete(Number(params.id));
      return { data: null };
    }),
  );

  const query = db.item.where((row) => eq(row.group, 1)).orderBy((row) => row.id);
  const unsubscribe = query.subscribe(() => {});
  const writes: Promise<unknown>[] = [];
  const log: string[] = [];

  for (let step = 0; step < 40; step += 1) {
    const id = random.int(1, 6);
    const action = random.int(0, 9);
    if (action <= 1) {
      const title = `c${step}`;
      log.push(`client update ${id} ${title}`);
      if (db.item.findOne(id).local().getSnapshot().data) {
        writes.push(db.item.update(id, { title }));
      }
    } else if (action === 2) {
      log.push(`client insert ${id}`);
      if (!db.item.findOne(id).local().getSnapshot().data) {
        writes.push(db.item.insert({ id, group: 1, title: `n${step}`, version: 0 }));
      }
    } else if (action === 3) {
      log.push(`client delete ${id}`);
      if (db.item.findOne(id).local().getSnapshot().data) {
        writes.push(db.item.delete(id));
      }
    } else if (action === 4) {
      log.push(`server change ${id}`);
      const current = table.get(id);
      if (current) {
        table.set(id, { ...current, title: `s${step}`, group: random.pick([1, 1, 2]), version: current.version + 1 });
      } else {
        table.set(id, { id, group: 1, title: `s${step}`, version: 1 });
      }
    } else if (action === 5) {
      log.push(`refetch`);
      writes.push(query.refetch());
    } else if (held.length > 0) {
      log.push(`release one of ${held.length}`);
      held.splice(random.int(0, held.length - 1), 1)[0].release();
    }
    await flush(2);
  }

  // Release everything in a random order, then stop holding and load once more
  while (held.length > 0) {
    held.splice(random.int(0, held.length - 1), 1)[0].release();
    await flush(2);
  }
  holding = false;
  await vi.waitFor(async () => {
    while (held.length > 0) {
      held.shift()!.release();
    }
    await Promise.all(writes);
  });
  await query.refetch();
  await flush();

  const want = [...table.values()].filter((row) => row.group === 1).toSorted((left, right) => left.id - right.id);
  const context = `seed ${seed}${useVersion ? " with version" : ""}, steps:\n${log.join("\n")}`;
  expect(query.getSnapshot().data, context).toStrictEqual(want);
  expect(db.inspect().collections[0].layers, context).toStrictEqual([]);
  unsubscribe();
  db.destroy();
};

describe("db [ Model ] convergence under random races", () => {
  beforeAll(() => startServer());
  beforeEach(() => resetMocks());
  afterAll(() => stopServer());

  it.each(Array.from({ length: 60 }, (_, index) => index + 1))("seed %i", async (seed) => {
    await runSeed(seed, false);
  });

  it.each(Array.from({ length: 30 }, (_, index) => index + 101))("seed %i with a version field", async (seed) => {
    await runSeed(seed, true);
  });
});
