import { FirebaseSocketsAdminAdapter, FirebaseAdminAdapter } from "adapter";

/**
 * @vitest-environment node
 */
import { realtimeDbAdmin, seedRealtimeDatabaseAdmin } from "../../../utils";
import { socketsMethodsSharedTestCases } from "../shared/methods.shared.tests";

describe("Realtime Database Admin [Sockets]", () => {
  socketsMethodsSharedTestCases(
    realtimeDbAdmin,
    seedRealtimeDatabaseAdmin,
    FirebaseSocketsAdminAdapter,
    FirebaseAdminAdapter,
  );
});
