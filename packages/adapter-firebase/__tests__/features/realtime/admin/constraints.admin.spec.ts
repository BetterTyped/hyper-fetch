import { firebaseAdminAdapter } from "adapter/index.server";
import { seedRealtimeDatabaseAdmin } from "../../../utils/admin/seed.admin";
import { realtimeDbAdmin } from "../../../utils";
import { constraintsSharedTestCases } from "../shared/constraints.shared.tests";

describe("Realtime Database Admin [Constraints]", () => {
  let db;
  beforeEach(async () => {
    db = await realtimeDbAdmin;
    await db.ref("teas").set(null);
    await seedRealtimeDatabaseAdmin(db);
  });

  constraintsSharedTestCases(() => firebaseAdminAdapter(db));
});
