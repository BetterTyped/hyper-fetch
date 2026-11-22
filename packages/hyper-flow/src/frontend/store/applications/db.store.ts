import type { DevtoolsDbEventData } from "@hyper-fetch/plugin-devtools";
import { DbEvents } from "@hyper-fetch/plugin-devtools";
import { create } from "zustand/react";

/** One db as `db.inspect()` describes it. HyperFlow reads it as data, so it does not depend on `@hyper-fetch/db`. */
export type DbInspection = {
  collections: {
    name: string;
    rows: number;
    layers: { id: string; key: string | number; type: "insert" | "update" | "delete" }[];
    subsets: {
      id: string;
      kind: "list" | "key";
      loader: number;
      rows: number;
      fresh: boolean;
      live: boolean;
      loading: boolean;
      error: unknown;
      loadedAt: number;
      observers: number;
    }[];
  }[];
  queries: {
    key: string;
    collection: string;
    subscribers: number;
    status: "loading" | "ready" | "error";
    rows: number | undefined;
    plan: {
      kind: string;
      loader?: number;
      sent: unknown[];
      local: unknown[];
      answeredLocally: boolean;
      syncs: { type: string; topic: string }[];
    };
  }[];
  outbox: { id: string; collection: string; op: string; key: string | number; sent: boolean; createdAt: number }[];
};

export type InspectedDb = { id: string; inspection: DbInspection; updatedAt: number };

export type ApplicationDbs = {
  dbs: Record<string, InspectedDb>;
  selectedDbId: string | null;
  selectedCollection: string | null;
};

const getInitialState = (): ApplicationDbs => ({ dbs: {}, selectedDbId: null, selectedCollection: null });

type DbStore = {
  applications: { [application: string]: ApplicationDbs };
  initialize: (application: string) => void;
  /** Keeps the latest snapshot the devtools plugin reported for one of the application's dbs */
  handleEvent: (application: string, event: DbEvents, data: DevtoolsDbEventData) => void;
  selectDb: (application: string, dbId: string) => void;
  selectCollection: (application: string, collection: string | null) => void;
};

export const useDbStore = create<DbStore>((set) => {
  const update = (application: string, change: (state: ApplicationDbs) => Partial<ApplicationDbs>) =>
    set((store) => {
      const current = store.applications[application] ?? getInitialState();
      return { applications: { ...store.applications, [application]: { ...current, ...change(current) } } };
    });

  return {
    applications: {},
    initialize: (application) =>
      set((store) => ({ applications: { ...store.applications, [application]: getInitialState() } })),
    handleEvent: (application, event, data) => {
      if (event !== DbEvents.SNAPSHOT) {
        return;
      }
      update(application, (state) => ({
        dbs: {
          ...state.dbs,
          [data.dbId]: { id: data.dbId, inspection: data.inspection as DbInspection, updatedAt: data.timestamp },
        },
        selectedDbId: state.selectedDbId ?? data.dbId,
      }));
    },
    selectDb: (application, dbId) => update(application, () => ({ selectedDbId: dbId, selectedCollection: null })),
    selectCollection: (application, collection) => update(application, () => ({ selectedCollection: collection })),
  };
});
