import { realtimeDBAdmin, seedRealtimeDatabaseAdmin } from "../../utils";
import { socketsMethodsSharedTestCases } from "../shared/methods.shared.tests";
import { firebaseAdminAdapter, RealtimeSocketAdapterType } from "adapter";
import { firebaseSocketsAdminAdapter } from "../../../src/adapter/admin/adapter.admin.sockets";

describe("Realtime Database Admin [Sockets]", () => {
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

  socketsMethodsSharedTestCases(
    () => firebaseSocketsAdminAdapter(db) as RealtimeSocketAdapterType,
    () => firebaseAdminAdapter(db),
  );
});
