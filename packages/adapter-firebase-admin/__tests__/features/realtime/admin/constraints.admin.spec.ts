import { FirebaseAdminAdapter } from "adapter";
import { seedRealtimeDatabaseAdmin } from "../../../utils/seed.admin";
import { realtimeDbAdmin } from "../../../utils";
import { constraintsSharedTestCases } from "../shared/constraints.shared.tests";

describe("Realtime Database Admin [Constraints]", () => {
  let db: any;
  beforeEach(async () => {
    db = await realtimeDbAdmin;
    await db.ref("teas").set(null);
    await seedRealtimeDatabaseAdmin(db);
  });

  constraintsSharedTestCases(() => FirebaseAdminAdapter(db));
});
