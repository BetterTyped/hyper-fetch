/**
 * @jest-environment node
 */
import { realtimeDbAdmin, seedRealtimeDatabaseAdmin } from "../../../utils";
import { socketsMethodsSharedTestCases } from "../shared/methods.shared.tests";
import { FirebaseSocketsAdminAdapter, FirebaseAdminAdapter } from "adapter";

describe("Realtime Database Admin [Sockets]", () => {
  socketsMethodsSharedTestCases(
    realtimeDbAdmin,
    seedRealtimeDatabaseAdmin,
    FirebaseSocketsAdminAdapter,
    FirebaseAdminAdapter,
  );
});
