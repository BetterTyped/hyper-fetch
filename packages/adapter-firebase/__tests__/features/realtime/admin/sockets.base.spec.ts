/**
 * @jest-environment node
 */
import { realtimeDbAdmin, seedRealtimeDatabaseBrowser } from "../../../utils";
import { socketsMethodsSharedTestCases } from "../shared/methods.shared.tests";
import { firebaseSocketsAdminAdapter, firebaseAdminAdapter } from "adapter/index.server";

describe("Realtime Database Admin [Sockets]", () => {
  socketsMethodsSharedTestCases(
    realtimeDbAdmin,
    seedRealtimeDatabaseBrowser,
    firebaseSocketsAdminAdapter,
    firebaseAdminAdapter,
  );
});
