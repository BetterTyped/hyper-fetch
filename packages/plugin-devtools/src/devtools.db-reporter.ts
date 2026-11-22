import type { DevtoolsDb, DevtoolsDbEventData } from "./types/events.types";
import { DbEvents } from "./types/events.types";

type Report = (eventName: DbEvents, data: DevtoolsDbEventData) => void;

/**
 * Reports one `@hyper-fetch/db` db: a snapshot of its collections, subsets, live queries, optimistic layers and outbox,
 * sent once per tick in which the db changed, and whenever HyperFlow connects.
 */
export const createDbReporter = ({ db, dbId, report }: { db: DevtoolsDb; dbId: string; report: Report }) => {
  let scheduled = false;
  const sendSnapshot = () => report(DbEvents.SNAPSHOT, { dbId, timestamp: Date.now(), inspection: db.inspect() });
  const unmount = db.onChange(() => {
    // A burst of writes becomes one snapshot
    if (scheduled) {
      return;
    }
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      sendSnapshot();
    });
  });
  return { sendSnapshot, unmount };
};
