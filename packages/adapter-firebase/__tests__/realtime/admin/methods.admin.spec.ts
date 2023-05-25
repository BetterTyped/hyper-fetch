/**
 * @jest-environment node
 */
import { realtimeDBAdmin as db } from "./initialize.admin";
import { seedRealtimeDatabaseAdmin } from "../../utils/seed.admin";
import { adapterAdmin } from "adapter";
import { methodsSharedTestCases } from "../shared/methods.shared.tests";

describe("Realtime Database Admin [ Methods ]", () => {
  let realtimeDBAdmin;

  beforeAll(async () => {
    realtimeDBAdmin = await db;
  });
  beforeEach(async () => {
    await realtimeDBAdmin.ref("teas").set(null);
    await seedRealtimeDatabaseAdmin(realtimeDBAdmin);
  });

  afterEach(async () => {
    await realtimeDBAdmin.ref("teas").set(null);
  });

  methodsSharedTestCases(() => adapterAdmin(realtimeDBAdmin));
});
