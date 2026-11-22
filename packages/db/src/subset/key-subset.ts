import type { LoaderConfig, RowKey } from "../collection/collection.types";
import type { CollectionRuntime } from "../db/collection.runtime";
import type { Stamp } from "../store/store.types";
import type { LoadOptions } from "./base-subset";
import { BaseSubset } from "./base-subset";

/** One row read by key, for `findOne`. Keys read in the same tick are batched when the loader has `byKeys`. */
export class KeySubset extends BaseSubset {
  constructor(
    collection: CollectionRuntime,
    loader: LoaderConfig,
    readonly key: RowKey,
  ) {
    super(collection, loader);
  }

  holds = (key: RowKey) => key === this.key;

  /** The fields of the row the server sent, so syncs scoped by those fields keep it live */
  getEqValues = (): Record<string, unknown> => this.collection.store.getServerRow(this.key) ?? {};

  /** Called by the collection when the batched request for this key settled */
  complete = (result: { success: true; found: boolean; stamp: Stamp } | { success: false; error: unknown }) => {
    if (result.success) {
      // The server answered for this key, so a row it did not return is gone, and older events cannot bring it back
      if (!result.found) {
        this.collection.store.remove(this.key, result.stamp);
      }
      this.hasLoaded = true;
      this.loadedAt = Date.now();
      this.invalidated = false;
      this.error = null;
    } else {
      this.error = result.error;
    }
    this.endLoad();
    this.collection.markSubsetChanged(this);
  };

  protected run = async (options: LoadOptions) => {
    this.beginLoad();
    await this.collection.loadKey(this, options.waitForWrites !== false);
  };
}
