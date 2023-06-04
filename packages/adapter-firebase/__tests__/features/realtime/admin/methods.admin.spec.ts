/**
 * @jest-environment node
 */
import { realtimeDBAdmin } from "../../../utils";
import { seedRealtimeDatabaseAdmin } from "../../../utils/admin/seed.admin";
import { firebaseAdminAdapter } from "adapter";
import { methodsSharedTestCases } from "../shared/methods.shared.tests";

describe("Realtime Database Admin [ Methods ]", () => {
  let db;

  beforeAll(async () => {
    db = await realtimeDBAdmin;
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
