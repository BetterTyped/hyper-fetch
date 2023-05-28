import { realtimeDBAdmin as db } from "../admin/initialize.admin";

import { seedRealtimeDatabaseAdmin } from "../../utils/seed.admin";
import { socketsMethodsSharedTestCases } from "../shared/methods.shared.tests";
import { realtimeSocketsBrowser } from "realtime";

describe("Realtime Database Browser [Methods]", () => {
  let realtimeDBAdmin;
  beforeEach(async () => {
    realtimeDBAdmin = await db;
    await realtimeDBAdmin.ref("teas").set(null);
    await seedRealtimeDatabaseAdmin(realtimeDBAdmin);
  });
  socketsMethodsSharedTestCases(realtimeSocketsBrowser(realtimeDBAdmin), () => firebaseAdminAdapter(realtimeDBAdmin));
});
