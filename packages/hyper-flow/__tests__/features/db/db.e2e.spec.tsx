import type { DevtoolsDb } from "@hyper-fetch/plugin-devtools";
import { screen, waitFor, within } from "@testing-library/react";

import { createHyperFlowEnv } from "../../utils/hyper-flow";
import type { DbInspection } from "@/store/applications/db.store";
import { useDbStore } from "@/store/applications/db.store";

/** A db as the plugin reads it, holding the snapshot `inspect` returns */
const createInspectedDb = (initial: DbInspection) => {
  let inspection = initial;
  const listeners = new Set<() => void>();
  const db: DevtoolsDb = {
    inspect: () => inspection,
    onChange: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  const update = (next: DbInspection) => {
    inspection = next;
    listeners.forEach((listener) => listener());
  };
  return { db, update };
};

const inspection: DbInspection = {
  collections: [
    {
      name: "post",
      rows: 3,
      layers: [{ id: "w1", key: 1, type: "update" }],
      subsets: [
        {
          id: "team-1",
          kind: "list",
          loader: 0,
          rows: 2,
          fresh: true,
          live: true,
          loading: false,
          error: null,
          loadedAt: 1,
          observers: 1,
        },
        {
          id: "7",
          kind: "key",
          loader: 1,
          rows: 1,
          fresh: false,
          live: false,
          loading: true,
          error: null,
          loadedAt: 0,
          observers: 1,
        },
      ],
    },
    { name: "user", rows: 0, layers: [], subsets: [] },
  ],
  queries: [
    {
      key: "q1",
      collection: "post",
      subscribers: 2,
      status: "ready",
      rows: 2,
      plan: {
        kind: "list",
        loader: 0,
        sent: [{ op: "eq", field: "teamId", value: 1 }],
        local: [{ op: "gt", field: "likes", value: 5 }],
        answeredLocally: false,
        syncs: [{ type: "update", topic: "teams/1/posts/changed" }],
      },
    },
  ],
  outbox: [],
};

describe("DB [ E2E ]", () => {
  const env = createHyperFlowEnv();

  beforeEach(async () => {
    await env.start();
  });

  afterEach(async () => {
    await env.stop();
  });

  const setup = async (dbs: DevtoolsDb[]) => {
    const { plugin } = env.connectApp({ dbs });
    const view = env.renderApp();
    await env.waitForApp(plugin);
    await view.navigate("/applications/App/db");
    return view;
  };

  it("explains how to inspect a db when there is none", async () => {
    await setup([]);
    expect(await screen.findByText("No dbs inspected")).toBeInTheDocument();
    expect(screen.getByText(/dbs: \[db\]/)).toBeInTheDocument();
  });

  it("shows collections, their subsets, live queries with plans, and follows changes", async () => {
    const inspected = createInspectedDb(inspection);
    const view = await setup([inspected.db]);

    const collections = await screen.findAllByTestId("db-collection");
    expect(collections.map((row) => row.textContent)).toStrictEqual(["post321", "user000"]);

    const [query] = screen.getAllByTestId("db-query");
    expect(within(query).getByText("ready")).toBeInTheDocument();
    expect(within(query).getByText(/loader 0/)).toBeInTheDocument();
    expect(query.textContent).toContain('"field":"teamId"');
    expect(query.textContent).toContain("update teams/1/posts/changed");

    await view.user.click(collections[0]);
    const subsets = await screen.findAllByTestId("db-subset");
    expect(subsets.map((row) => row.textContent)).toStrictEqual(["team-102live, fresh1", "key 711loading, stale1"]);
    expect(screen.getByText("The outbox is empty.")).toBeInTheDocument();

    inspected.update({
      ...inspection,
      queries: [],
      outbox: [{ id: "w2", collection: "post", op: "insert", key: 9, sent: false, createdAt: 1 }],
    });
    await waitFor(() => expect(screen.getAllByTestId("db-outbox-entry")).toHaveLength(1));
    expect(screen.getByText("No live queries.")).toBeInTheDocument();
    await view.user.click(collections[0]);
    expect(screen.queryAllByTestId("db-subset")).toHaveLength(0);
  });

  it("switches between several dbs", async () => {
    const first = createInspectedDb(inspection);
    const second = createInspectedDb({
      collections: [{ name: "order", rows: 1, layers: [], subsets: [] }],
      queries: [],
      outbox: [],
    });
    const view = await setup([first.db, second.db]);
    await screen.findAllByTestId("db-collection");
    await view.user.click(screen.getByRole("button", { name: "db #2" }));
    await waitFor(() =>
      expect(screen.getAllByTestId("db-collection").map((row) => row.textContent)).toStrictEqual(["order100"]),
    );
    expect(useDbStore.getState().applications.App.selectedDbId).toBe("db #2");
  });
});
