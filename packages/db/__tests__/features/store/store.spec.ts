import { Store } from "../../../src/store/store";
import type { Stamp } from "../../../src/store/store.types";

const sent = (seq: number): Stamp => ({ kind: "sent", seq, wall: seq });
const now = (seq: number): Stamp => ({ kind: "now", seq, wall: seq });

const createStore = (versionField?: string) => {
  const changes: (string | number)[] = [];
  const store = new Store({ keyField: "id", versionField, onChange: (key) => changes.push(key) });
  return { store, changes };
};

describe("Store", () => {
  it("creates rows with complete writes and ignores partial writes to rows it does not hold", () => {
    const { store, changes } = createStore();
    expect(store.write(1, { id: 1, title: "a" }, { complete: false, stamp: sent(1) })).toBeFalse();
    expect(store.write(1, { id: 1, title: "a" }, { complete: true, stamp: sent(2) })).toBeTrue();
    expect(store.write(1, { id: 1, title: "a" }, { complete: true, stamp: sent(3) })).toBeFalse();
    expect(store.getServerKeys()).toStrictEqual([1]);
    expect(changes).toStrictEqual([1]);
  });

  it("keeps fields written after a request was sent", () => {
    const { store } = createStore();
    store.write(1, { id: 1, title: "first", likes: 1 }, { complete: true, stamp: sent(1) });
    store.write(1, { id: 1, title: "event" }, { complete: false, stamp: now(5) });
    store.write(1, { id: 1, title: "stale", likes: 2 }, { complete: true, stamp: sent(4) });
    expect(store.get(1)).toStrictEqual({ id: 1, title: "event", likes: 2 });
    store.write(1, { id: 1, title: "newer" }, { complete: true, stamp: sent(6) });
    expect(store.get(1)?.title).toBe("newer");
  });

  it("never lets an event applied late, after a buffer, beat a newer write or bring back a deleted row", () => {
    const { store } = createStore();
    store.write(1, { id: 1, title: "response" }, { complete: true, stamp: sent(5) });
    store.write(1, { id: 1, title: "older event" }, { complete: true, stamp: now(3) });
    expect(store.get(1)?.title).toBe("response");
    store.remove(2, sent(7));
    expect(store.write(2, { id: 2 }, { complete: true, stamp: now(6) })).toBeFalse();
  });

  it("orders writes by version when they carry it", () => {
    const { store } = createStore("version");
    store.write(1, { id: 1, title: "v5", version: 5 }, { complete: true, stamp: sent(1) });
    store.write(1, { id: 1, title: "v3", version: 3 }, { complete: true, stamp: now(2) });
    expect(store.get(1)?.title).toBe("v5");
    store.write(1, { id: 1, title: "v5 again", version: 5 }, { complete: true, stamp: sent(3) });
    expect(store.get(1)?.title).toBe("v5 again");
    store.write(1, { id: 1, likes: 1 }, { complete: false, stamp: now(4) });
    store.write(1, { id: 1, likes: 0 }, { complete: false, stamp: sent(3) });
    expect(store.get(1)?.likes).toBe(1);
  });

  it("drops the fields a complete write leaves out, unless a newer write set them", () => {
    const { store } = createStore();
    store.write(1, { id: 1, title: "a", note: "x", draft: true }, { complete: true, stamp: sent(1) });
    store.write(1, { id: 1, draft: false }, { complete: false, stamp: now(5) });
    store.write(1, { id: 1, title: "b" }, { complete: true, stamp: sent(3) });
    // `note` was last written before the response, so the response's row has no `note`; `draft` changed after it
    expect(store.get(1)).toStrictEqual({ id: 1, title: "b", draft: false });
  });

  it("does not let an older write bring back a deleted row", () => {
    const { store } = createStore();
    store.write(1, { id: 1 }, { complete: true, stamp: sent(1) });
    store.remove(1, now(5));
    expect(store.write(1, { id: 1 }, { complete: true, stamp: sent(4) })).toBeFalse();
    expect(store.write(1, { id: 1 }, { complete: true, stamp: sent(6) })).toBeTrue();
    store.remove(1, now(10));
    expect(store.write(1, { id: 1 }, { complete: true, stamp: now(11) })).toBeTrue();
  });

  it("keeps the newest delete and never drops a row written after an older delete", () => {
    const { store } = createStore();
    store.remove(1, now(15));
    store.remove(1, sent(10));
    expect(store.write(1, { id: 1 }, { complete: true, stamp: sent(12) })).toBeFalse();
    store.write(2, { id: 2 }, { complete: true, stamp: now(12) });
    store.remove(2, sent(10));
    expect(store.get(2)).toStrictEqual({ id: 2 });
  });

  it("drops a field a newer complete version leaves out", () => {
    const { store } = createStore("version");
    store.write(1, { id: 1, note: "x", version: 1 }, { complete: true, stamp: sent(1) });
    store.write(1, { id: 1, version: 2 }, { complete: true, stamp: sent(2) });
    expect(store.get(1)).toStrictEqual({ id: 1, version: 2 });
  });

  it("orders writes of an equal version by when they were made", () => {
    const { store } = createStore("version");
    store.write(1, { id: 1, title: "A", version: 3 }, { complete: true, stamp: sent(1) });
    store.write(1, { id: 1, title: "B" }, { complete: false, stamp: now(5) });
    store.write(1, { id: 1, title: "A", version: 3 }, { complete: true, stamp: sent(2) });
    expect(store.get(1)?.title).toBe("B");
  });

  it("forgets deletes once every earlier request settled", () => {
    const { store } = createStore();
    store.remove(1, now(5));
    store.remove(2, now(9));
    store.forgetTombstones(6);
    expect(store.write(1, { id: 1 }, { complete: true, stamp: sent(1) })).toBeTrue();
    expect(store.write(2, { id: 2 }, { complete: true, stamp: sent(1) })).toBeFalse();
    expect(store.drop(3)).toBeFalse();
  });

  it("applies optimistic layers over server rows and reverts them", () => {
    const { store } = createStore();
    store.write(1, { id: 1, title: "server" }, { complete: true, stamp: sent(1) });
    store.addLayer({ id: "a", key: 1, type: "update", values: { title: "edit" } });
    store.addLayer({ id: "b", key: 2, type: "update", values: { title: "missing row" } });
    store.addLayer({ id: "c", key: 3, type: "insert", values: { id: 3 } });
    store.addLayer({ id: "d", key: 3, type: "delete", values: {} });
    expect(store.get(1)?.title).toBe("edit");
    expect(store.get(2)).toBeUndefined();
    expect(store.get(3)).toBeUndefined();
    expect(store.keys()).toStrictEqual([1]);
    expect(store.hasLayer(1)).toBeTrue();
    store.removeLayer("a");
    store.removeLayer("unknown");
    expect(store.get(1)?.title).toBe("server");
    expect(store.hasLayer(1)).toBeFalse();
  });

  it("moves layers of a temporary key to the server's key", () => {
    const { store } = createStore();
    store.addLayer({ id: "a", key: "tmp", type: "insert", values: { id: "tmp", title: "new" } });
    store.addLayer({ id: "b", key: 5, type: "update", values: { title: "other" } });
    store.rekeyLayers("tmp", 9);
    expect(store.get(9)).toStrictEqual({ id: 9, title: "new" });
    expect(store.get("tmp")).toBeUndefined();
    expect(store.getArrival(9)).toBeNumber();
  });

  it("clears rows, layers and deletes", () => {
    const { store, changes } = createStore();
    store.write(1, { id: 1 }, { complete: true, stamp: sent(1) });
    store.addLayer({ id: "a", key: 2, type: "insert", values: { id: 2 } });
    store.remove(3, now(2));
    changes.length = 0;
    store.clear();
    expect(store.keys()).toStrictEqual([]);
    expect(changes).toIncludeSameMembers([1, 2]);
    expect(store.write(3, { id: 3 }, { complete: true, stamp: sent(1) })).toBeTrue();
  });
});
