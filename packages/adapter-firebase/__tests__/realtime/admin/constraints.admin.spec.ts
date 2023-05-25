import { adapterAdmin } from "adapter";
import { seedRealtimeDatabaseAdmin } from "../../utils/seed.admin";
import { realtimeDBAdmin as db } from "./initialize.admin";
import { constraintsSharedTestCases } from "../shared/constraints.shared.tests";

describe("Realtime Database Admin [Constraints]", () => {
  let realtimeDBAdmin;
  beforeEach(async () => {
    realtimeDBAdmin = await db;
    await realtimeDBAdmin.ref("teas").set(null);
    await seedRealtimeDatabaseAdmin(realtimeDBAdmin);
  });

  constraintsSharedTestCases(() => adapterAdmin(realtimeDBAdmin));
});
