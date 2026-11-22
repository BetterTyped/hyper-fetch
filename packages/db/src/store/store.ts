import type { RowKey } from "../collection/collection.types";
import { compareValues, isEqualValue } from "../operators/operators.utils";
import type { FieldMeta, Layer, Row, Stamp } from "./store.types";

/**
 * Holds one collection's rows. Server rows and optimistic layers are kept apart: queries read the server row with
 * every pending layer applied on top, and dropping a layer reverts exactly what it changed.
 *
 * Writes are ordered per field. A field keeps its value when the write is older than the one that set it: an older
 * `version`, or a response to a request sent before the field was written.
 */
export class Store {
  private rows = new Map<RowKey, Row>();
  private meta = new Map<RowKey, Map<string, FieldMeta>>();
  private tombstones = new Map<RowKey, { seq: number; wall: number }>();
  private layers: Layer[] = [];
  private visible = new Map<RowKey, Row | undefined>();
  private arrival = new Map<RowKey, number>();
  private arrivalCounter = 0;
  /** Stores of linked collections, which hold some of this store's fields for the same keys */
  private links: Store[] = [];

  constructor(
    private readonly options: {
      keyField: string;
      versionField?: string;
      onChange: (key: RowKey) => void;
    },
  ) {}

  /** Whether the server state holds the row */
  hasServerRow = (key: RowKey) => this.rows.has(key);

  /** The pending optimistic layers, oldest first */
  getLayers = (): readonly Layer[] => this.layers;

  /** The server row, without optimistic layers */
  getServerRow = (key: RowKey) => this.rows.get(key);

  /** The newest `seq` that wrote any field of a server row, or 0 */
  getLastSeq = (key: RowKey): number => {
    const fields = this.meta.get(key);
    return fields ? Math.max(0, ...[...fields.values()].map((meta) => meta.seq)) : 0;
  };

  /** Every key with a server row */
  getServerKeys = () => [...this.rows.keys()];

  /** The row as queries see it: the server row with every pending layer applied */
  get = (key: RowKey): Row | undefined => {
    if (this.visible.has(key)) {
      return this.visible.get(key);
    }
    let row = this.rows.get(key);
    for (const layer of this.layers) {
      if (layer.key !== key) {
        continue;
      }
      if (layer.type === "insert") {
        row = { ...layer.values };
      } else if (layer.type === "update") {
        row = row ? { ...row, ...layer.values } : undefined;
      } else {
        row = undefined;
      }
    }
    const visible = row && row !== this.rows.get(key) ? Object.freeze(row) : row;
    this.visible.set(key, visible);
    return visible;
  };

  /** Every key queries can see */
  keys = (): RowKey[] => {
    const keys = new Set<RowKey>(this.rows.keys());
    this.layers.forEach((layer) => keys.add(layer.key));
    return [...keys].filter((key) => this.get(key) !== undefined);
  };

  /** The order in which the db first saw a row, used when a query has no `orderBy` */
  getArrival = (key: RowKey) => this.arrival.get(key)!;

  /** Whether a pending write touches the row */
  hasLayer = (key: RowKey) => this.layers.some((layer) => layer.key === key);

  /**
   * Writes server fields. A complete write creates the row or replaces its fields, a partial write changes only the
   * fields it carries and is ignored for a row the store does not hold. Returns whether the row changed.
   */
  /** Links another store: writes, deletes and layers on one change the fields the other has, for the same key */
  link = (store: Store) => {
    this.links.push(store);
  };

  write = (
    key: RowKey,
    written: Row,
    { complete, stamp, linked = true }: { complete: boolean; stamp: Stamp; linked?: boolean },
  ): boolean => {
    // `undefined` is not a value: an update leaves the field as it is, and a complete row leaves it out, which drops it
    const values = Object.fromEntries(Object.entries(written).filter(([, value]) => value !== undefined));
    const tombstone = this.tombstones.get(key);
    if (tombstone) {
      if (stamp.seq < tombstone.seq) {
        return false;
      }
      this.tombstones.delete(key);
    }

    const current = this.rows.get(key);
    if (!current && !complete) {
      return false;
    }

    const fieldsMeta = this.meta.get(key) ?? new Map<string, FieldMeta>();
    const { versionField } = this.options;
    const incomingVersion = versionField ? values[versionField] : undefined;
    const hasVersion = incomingVersion !== undefined;
    const next: Row = current ? { ...current } : {};
    const accepted: Row = {};
    let changed = !current;

    Object.keys(values).forEach((field) => {
      const meta = fieldsMeta.get(field);
      if (!this.accepts(meta, stamp, hasVersion ? incomingVersion : undefined)) {
        return;
      }
      fieldsMeta.set(field, {
        seq: stamp.seq,
        wall: stamp.wall,
        version: hasVersion ? incomingVersion : meta?.version,
      });
      accepted[field] = values[field];
      if (!current || !isEqualValue(current[field], values[field])) {
        next[field] = values[field];
        changed = true;
      }
    });

    // A complete row replaces the stored one, so a field it leaves out is gone, unless a newer write set it
    if (complete && current) {
      Object.keys(current).forEach((field) => {
        if (field in values || !this.accepts(fieldsMeta.get(field), stamp, hasVersion ? incomingVersion : undefined)) {
          return;
        }
        fieldsMeta.set(field, { seq: stamp.seq, wall: stamp.wall, version: hasVersion ? incomingVersion : undefined });
        delete next[field];
        changed = true;
      });
    }

    this.meta.set(key, fieldsMeta);
    if (!this.arrival.has(key)) {
      this.arrivalCounter += 1;
      this.arrival.set(key, this.arrivalCounter);
    }
    if (changed) {
      // Rows are shared with every query and component, so changing one in place must fail rather than corrupt them
      this.rows.set(key, Object.freeze(next));
      this.invalidate(key);
    }
    if (linked) {
      this.links.forEach((store) => store.mirrorWrite(key, accepted, stamp));
    }
    return changed;
  };

  /** Removes a row the server deleted, and remembers the key so an older response cannot bring it back */
  remove = (key: RowKey, stamp: Stamp, linked = true): boolean => {
    // The newest delete wins, so an older "not found" never lets a response sent before a newer delete bring it back
    const tombstone = this.tombstones.get(key);
    if (!tombstone || tombstone.seq < stamp.seq) {
      this.tombstones.set(key, { seq: stamp.seq, wall: stamp.wall });
    }
    if (linked) {
      this.links.forEach((store) => store.remove(key, stamp, false));
    }
    // A row written after the delete, such as an insert event after an older "not found", stays
    if (this.getLastSeq(key) > stamp.seq) {
      return false;
    }
    return this.drop(key);
  };

  /** Removes a row without remembering it, for rows no subset holds any more */
  drop = (key: RowKey): boolean => {
    if (!this.rows.has(key)) {
      return false;
    }
    this.rows.delete(key);
    this.meta.delete(key);
    this.invalidate(key);
    return true;
  };

  /** Forgets deleted keys once every request sent before the delete has settled */
  forgetTombstones = (oldestPendingSeq: number) => {
    this.tombstones.forEach((tombstone, key) => {
      if (tombstone.seq < oldestPendingSeq) {
        this.tombstones.delete(key);
      }
    });
  };

  addLayer = (layer: Layer, linked = true) => {
    if (linked) {
      this.links.forEach((store) => store.mirrorLayer(layer));
    }
    this.layers.push(layer);
    if (!this.arrival.has(layer.key)) {
      this.arrivalCounter += 1;
      this.arrival.set(layer.key, this.arrivalCounter);
    }
    this.invalidate(layer.key);
  };

  removeLayer = (id: string, linked = true) => {
    if (linked) {
      this.links.forEach((store) => store.removeLayer(`${id}@link`, false));
    }
    const layer = this.layers.find((item) => item.id === id);
    if (!layer) {
      return;
    }
    this.layers = this.layers.filter((item) => item.id !== id);
    this.invalidate(layer.key);
  };

  /** Moves the pending layers of a temporary key to the key the server assigned */
  rekeyLayers = (from: RowKey, to: RowKey) => {
    // The row keeps its place in lists without an order, when it had one
    if (this.arrival.has(from)) {
      this.arrival.set(to, this.arrival.get(from)!);
    }
    this.layers = this.layers.map((layer) => {
      if (layer.key !== from) {
        return layer;
      }
      return { ...layer, key: to, values: { ...layer.values, [this.options.keyField]: to } };
    });
    this.invalidate(from);
    this.invalidate(to);
  };

  /** Removes every row, layer and tombstone */
  clear = () => {
    const keys = new Set<RowKey>([...this.rows.keys(), ...this.layers.map((layer) => layer.key)]);
    this.rows.clear();
    this.meta.clear();
    this.tombstones.clear();
    this.layers = [];
    keys.forEach((key) => this.invalidate(key));
  };

  /** The fields a linked store wrote, limited to the fields this store's row has. Rows it does not hold stay away. */
  /** The fields of a row this store also has, by its server row, which a pending delete layer does not hide */
  private pickLinked = (key: RowKey, values: Row): Row | undefined => {
    const row = this.rows.get(key) ?? this.get(key);
    if (!row) {
      return undefined;
    }
    return Object.fromEntries(Object.entries(values).filter(([field]) => field in row));
  };

  private mirrorWrite = (key: RowKey, values: Row, stamp: Stamp) => {
    if (!this.rows.has(key)) {
      return;
    }
    this.write(key, this.pickLinked(key, values)!, { complete: false, stamp, linked: false });
  };

  /** Mirrors an update or delete layer. An insert cannot make a complete row of another shape, so it stays away. */
  private mirrorLayer = (layer: Layer) => {
    const values = this.pickLinked(layer.key, layer.values);
    if (!values || layer.type === "insert") {
      return;
    }
    this.addLayer({ ...layer, id: `${layer.id}@link`, values }, false);
  };

  private accepts = (meta: FieldMeta | undefined, stamp: Stamp, version: unknown): boolean => {
    if (version !== undefined) {
      if (meta?.version === undefined) {
        return true;
      }
      const order = compareValues(meta.version, version);
      // An equal version says nothing about which write is newer, so the one made later wins
      return order < 0 || (order === 0 && meta.seq <= stamp.seq);
    }
    // Events count from when they arrived, so one applied late, after a buffer, never beats a newer write
    if (!meta) {
      return true;
    }
    return meta.seq < stamp.seq;
  };

  private invalidate = (key: RowKey) => {
    this.visible.delete(key);
    this.options.onChange(key);
  };
}
