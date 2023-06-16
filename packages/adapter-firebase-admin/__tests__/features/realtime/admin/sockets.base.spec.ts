/**
 * @jest-environment node
 */
import { realtimeDbAdmin, seedRealtimeDatabaseAdmin } from "../../../utils";
import { socketsMethodsSharedTestCases } from "../shared/methods.shared.tests";
import { firebaseSocketsAdminAdapter, firebaseAdminAdapter } from "adapter";

describe("Realtime Database Admin [Sockets]", () => {
  socketsMethodsSharedTestCases(
    realtimeDbAdmin,
    seedRealtimeDatabaseAdmin,
    firebaseSocketsAdminAdapter,
    firebaseAdminAdapter,
  );
});
