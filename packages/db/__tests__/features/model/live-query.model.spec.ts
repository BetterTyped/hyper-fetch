/**
 * A model test: random server writes, deletes and optimistic layers against live queries with random filters, orders
 * and limits. After every step, each query must equal what a naive oracle computes from scratch, both when it is
 * subscribed (and kept current incrementally) and when it is read fresh. Seeds are fixed, so a failure reproduces.
 */
import { and, collection, eq, gt, gte, inArray, lt, lte, not, or, rowType } from "@hyper-fetch/db";
import type { Condition, FieldRef, RowRefs } from "@hyper-fetch/db";

import { CollectionHandle } from "../../../src/db/db";
import { DbRuntime } from "../../../src/db/db.runtime";
import type { Stamp } from "../../../src/store/store.types";
import { createRandom } from "../../utils/random";
import type { Random } from "../../utils/random";

type Item = { id: number; group: number; score: number | null; title: string; note?: string };

const KEYS = [1, 2, 3, 4, 5, 6, 7, 8];
const TITLES = ["a", "b", "ab", "B", ""];

/** A small deterministic PRNG, so every seed replays the same steps */

const randomRow = (random: Random, id: number): Item => {
  const row: Item = {
    id,
    group: random.int(0, 3),
    score: random.chance(0.2) ? null : random.int(-2, 5),
    title: random.pick(TITLES),
  };
  if (random.chance(0.5)) {
    row.note = random.pick(["x", "y"]);
  }
  return row;
};

const randomChanges = (random: Random, id: number): Partial<Item> & { id: number } => {
  const full = randomRow(random, id);
  const changes: Partial<Item> & { id: number } = { id };
  (["group", "score", "title"] as const).forEach((field) => {
    if (random.chance(0.5)) {
      Object.assign(changes, { [field]: full[field] });
    }
  });
  return changes;
};

/* ------------------------------------------------------------------ oracle */

type Predicate = (row: Item) => boolean;

const isEmpty = (value: unknown) => value === null || value === undefined;

/** The order the db promises: empty values first, numbers by value, strings by code point, ties by key */
const compareNaive = (left: unknown, right: unknown): number => {
  if (isEmpty(left) || isEmpty(right)) {
    if (isEmpty(left) && isEmpty(right)) {
      return 0;
    }
    return isEmpty(left) ? -1 : 1;
  }
  if (typeof left === "string" && typeof right === "string") {
    const a = [...left].map((char) => char.codePointAt(0)!);
    const b = [...right].map((char) => char.codePointAt(0)!);
    for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
      if (a[index] !== b[index]) {
        return a[index] < b[index] ? -1 : 1;
      }
    }
    return Math.sign(a.length - b.length);
  }
  return Math.sign((left as number) - (right as number));
};

type QuerySpec = {
  describe: string;
  where?: (row: RowRefs<Item>) => Condition<string, string>;
  predicate: Predicate;
  orderBy: { field: "group" | "score" | "title" | "id"; direction: "asc" | "desc" }[];
  limit?: number;
};

const FIELDS = ["group", "score", "title"] as const;

const randomComparison = (
  random: Random,
): { describe: string; build: (row: RowRefs<Item>) => Condition<string, string>; predicate: Predicate } => {
  const field = random.pick(FIELDS);
  const value = field === "title" ? random.pick(TITLES) : random.int(-2, 4);
  const op = random.pick(["eq", "gt", "gte", "lt", "lte", "inArray"] as const);
  const ref = (row: RowRefs<Item>) => row[field] as FieldRef<string, unknown>;
  const compare = (row: Item) => compareNaive(row[field], value);
  switch (op) {
    case "eq": {
      return {
        describe: `${field} = ${String(value)}`,
        build: (row) => eq(ref(row), value as never),
        predicate: (row) => Object.is(row[field], value),
      };
    }
    case "inArray": {
      const values = [value, field === "title" ? random.pick(TITLES) : random.int(-2, 4)];
      return {
        describe: `${field} in ${values.join(",")}`,
        build: (row) => inArray(ref(row), values as never[]),
        predicate: (row) => values.some((item) => Object.is(row[field], item)),
      };
    }
    case "gt": {
      return {
        describe: `${field} > ${String(value)}`,
        build: (row) => gt(ref(row) as never, value as never),
        predicate: (row) => !isEmpty(row[field]) && compare(row) > 0,
      };
    }
    case "gte": {
      return {
        describe: `${field} >= ${String(value)}`,
        build: (row) => gte(ref(row) as never, value as never),
        predicate: (row) => !isEmpty(row[field]) && compare(row) >= 0,
      };
    }
    case "lt": {
      return {
        describe: `${field} < ${String(value)}`,
        build: (row) => lt(ref(row) as never, value as never),
        predicate: (row) => !isEmpty(row[field]) && compare(row) < 0,
      };
    }
    default: {
      return {
        describe: `${field} <= ${String(value)}`,
        build: (row) => lte(ref(row) as never, value as never),
        predicate: (row) => !isEmpty(row[field]) && compare(row) <= 0,
      };
    }
  }
};

const randomCondition = (
  random: Random,
  depth = 0,
): { describe: string; build: (row: RowRefs<Item>) => Condition<string, string>; predicate: Predicate } => {
  if (depth >= 2 || random.chance(0.5)) {
    return randomComparison(random);
  }
  const kind = random.pick(["and", "or", "not"] as const);
  if (kind === "not") {
    const inner = randomCondition(random, depth + 1);
    return {
      describe: `not(${inner.describe})`,
      build: (row) => not(inner.build(row)),
      predicate: (row) => !inner.predicate(row),
    };
  }
  const left = randomCondition(random, depth + 1);
  const right = randomCondition(random, depth + 1);
  return kind === "and"
    ? {
        describe: `(${left.describe} and ${right.describe})`,
        build: (row) => and(left.build(row), right.build(row)),
        predicate: (row) => left.predicate(row) && right.predicate(row),
      }
    : {
        describe: `(${left.describe} or ${right.describe})`,
        build: (row) => or(left.build(row), right.build(row)),
        predicate: (row) => left.predicate(row) || right.predicate(row),
      };
};

const randomQuery = (random: Random): QuerySpec => {
  const condition = random.chance(0.85) ? randomCondition(random) : undefined;
  const orderBy = Array.from({ length: random.int(0, 2) }, () => ({
    field: random.pick(["group", "score", "title", "id"] as const),
    direction: random.pick(["asc", "desc"] as const),
  }));
  const limit = random.chance(0.4) ? random.int(0, 4) : undefined;
  return {
    describe: `${condition?.describe ?? "all"} order ${orderBy.map((o) => `${o.field} ${o.direction}`).join(", ")}${
      limit === undefined ? "" : ` limit ${limit}`
    }`,
    where: condition?.build,
    predicate: condition?.predicate ?? (() => true),
    orderBy: orderBy.length > 0 ? orderBy : [{ field: "id", direction: "asc" }],
    limit,
  };
};

/** What every query should show, computed from the visible rows without the db */
const expected = (spec: QuerySpec, rows: Item[]) => {
  const sorted = rows.filter(spec.predicate).toSorted((left, right) => {
    for (const { field, direction } of spec.orderBy) {
      const result = compareNaive(left[field], right[field]);
      if (result !== 0) {
        return direction === "desc" ? -result : result;
      }
    }
    return left.id - right.id;
  });
  return spec.limit === undefined ? sorted : sorted.slice(0, spec.limit);
};

type Layer = { id: string; key: number; type: "insert" | "update" | "delete"; values: Record<string, unknown> };

/** The visible rows as the db promises them: server rows with every pending layer applied in order */
const visibleRows = (server: Map<number, Item>, layers: Layer[]): Item[] => {
  const keys = new Set([...server.keys(), ...layers.map((layer) => layer.key)]);
  return [...keys]
    .map((key) => {
      let row: Record<string, unknown> | undefined = server.get(key);
      layers
        .filter((layer) => layer.key === key)
        .forEach((layer) => {
          if (layer.type === "insert") {
            row = { ...layer.values };
          } else if (layer.type === "update") {
            row = row ? { ...row, ...layer.values } : undefined;
          } else {
            row = undefined;
          }
        });
      return row as Item | undefined;
    })
    .filter((row): row is Item => row !== undefined);
};

/* --------------------------------------------------------------- the test */

const runSeed = (seed: number, steps: number) => {
  const random = createRandom(seed);
  const runtime = new DbRuntime({ item: collection(rowType<Item>(), { key: "id" }) });
  const handle = new CollectionHandle(runtime, "item");
  const runtimeCollection = runtime.collections.get("item")!;
  const { store } = runtimeCollection;
  let seq = 0;
  const stamp = (): Stamp => {
    seq += 1;
    return { kind: "sent", seq, wall: seq };
  };

  const specs = Array.from({ length: 8 }, () => randomQuery(random));
  const build = (spec: QuerySpec, extraLimit?: number) => {
    let query: any = handle.local();
    if (spec.where) {
      query = query.where(spec.where);
    }
    spec.orderBy.forEach(({ field, direction }) => {
      query = query.orderBy((row: RowRefs<Item>) => row[field], direction);
    });
    const limit = spec.limit ?? extraLimit;
    return limit === undefined ? query : query.limit(limit);
  };
  const live = specs.map((spec) => build(spec));
  const unsubscribes = live.map((query) => query.subscribe(() => {}));

  const server = new Map<number, Item>();
  let layers: Layer[] = [];
  let layerCounter = 0;
  const log: string[] = [];

  const check = () => {
    const rows = visibleRows(server, layers);
    specs.forEach((spec, index) => {
      const want = expected(spec, rows);
      const context = `seed ${seed}, query "${spec.describe}", after:\n${log.join("\n")}`;
      expect(live[index].getSnapshot().data, context).toStrictEqual(want);
      // A query nobody subscribes to is rebuilt from scratch, a second path that must agree
      const fresh = build(spec, spec.limit === undefined ? 1000 : undefined);
      expect(fresh.getSnapshot().data, `${context}\n(fresh read)`).toStrictEqual(want);
    });
  };

  const runStep = () => {
    const key = random.pick(KEYS);
    const action = random.int(0, 9);
    runtime.batch(() => {
      if (action <= 2) {
        const row = randomRow(random, key);
        log.push(`server write ${JSON.stringify(row)}`);
        server.set(key, row);
        runtimeCollection.writeServerRows([row], true, stamp());
      } else if (action <= 4) {
        const changes = randomChanges(random, key);
        log.push(`server update ${JSON.stringify(changes)}`);
        if (server.has(key)) {
          server.set(key, { ...server.get(key)!, ...changes });
        }
        runtimeCollection.writeServerRows([changes], false, stamp());
      } else if (action === 5) {
        log.push(`server delete ${key}`);
        server.delete(key);
        store.remove(key, stamp());
      } else if (action <= 8) {
        layerCounter += 1;
        const type = random.pick(["insert", "update", "delete"] as const);
        const values: Record<string, unknown> = { insert: randomRow, update: randomChanges, delete: () => ({}) }[type](
          random,
          key,
        );
        const layer: Layer = { id: `l${layerCounter}`, key, type, values };
        log.push(`layer ${layer.id} ${type} ${JSON.stringify(values)}`);
        layers.push(layer);
        store.addLayer({ ...layer });
      } else if (layers.length > 0) {
        const layer = random.pick(layers);
        log.push(`drop layer ${layer.id}`);
        layers = layers.filter((item) => item !== layer);
        store.removeLayer(layer.id);
      }
    });
    check();
  };
  Array.from({ length: steps }).forEach(runStep);
  unsubscribes.forEach((unsubscribe) => unsubscribe());
  runtime.destroy();
};

describe("db [ Model ] live queries against a naive oracle", () => {
  it.each(Array.from({ length: 150 }, (_, index) => index + 1))("seed %i", (seed) => {
    runSeed(seed, 40);
  });
});
