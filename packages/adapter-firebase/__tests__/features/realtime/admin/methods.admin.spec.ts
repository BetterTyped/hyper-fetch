/**
 * @jest-environment node
 */
import { seedRealtimeDatabaseAdmin, realtimeDbAdmin } from "../../../utils";
import { firebaseAdminAdapter } from "adapter/index.server";
import { methodsSharedTestCases } from "../shared/methods.shared.tests";

describe("Realtime Database Admin [ Methods ]", () => {
  let db;

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

  methodsSharedTestCases(() => firebaseAdminAdapter(db));
});
