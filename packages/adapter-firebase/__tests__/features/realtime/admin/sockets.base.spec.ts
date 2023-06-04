/**
 * @jest-environment node
 */
import { realtimeDBAdmin, seedRealtimeDatabaseAdmin } from "../../../utils";
import { socketsMethodsSharedTestCases } from "../shared/methods.shared.tests";
import { firebaseSocketsAdminAdapter, firebaseAdminAdapter } from "adapter";

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

  socketsMethodsSharedTestCases(firebaseSocketsAdminAdapter(db), firebaseAdminAdapter(db));
});
