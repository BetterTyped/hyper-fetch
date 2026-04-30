import { FirebaseAdminAdapter } from "adapter";

/**
 * @vitest-environment node
 */
import { realtimeDbAdmin, seedRealtimeDatabaseAdmin } from "../../../utils";
import { methodsSharedTestCases } from "../shared/methods.shared.tests";

describe("Realtime Database Admin [ Methods ]", () => {
  let db: any;

  beforeAll(async () => {
    db = await realtimeDbAdmin;
  });
  beforeEach(async () => {
    await db.ref("teas").set(null);
    await seedRealtimeDatabaseAdmin(db);
  });

  afterEach(async () => {
    await db.ref("teas").set(null);
  });

  methodsSharedTestCases(() => FirebaseAdminAdapter(db));
});
