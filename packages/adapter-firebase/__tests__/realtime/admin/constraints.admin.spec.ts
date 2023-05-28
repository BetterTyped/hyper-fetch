import { firebaseAdminAdapter } from "adapter";
import { seedRealtimeDatabaseAdmin } from "../../utils/admin/seed.admin";
import { realtimeDBAdmin } from "../../utils";
import { constraintsSharedTestCases } from "../shared/constraints.shared.tests";

describe("Realtime Database Admin [Constraints]", () => {
  let db;
  beforeEach(async () => {
    db = await realtimeDBAdmin;
    await db.ref("teas").set(null);
    await seedRealtimeDatabaseAdmin(db);
  });

  constraintsSharedTestCases(() => firebaseAdminAdapter(db));
});
