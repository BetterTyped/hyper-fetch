import { realtimeDBBrowser, seedRealtimeDatabaseBrowser } from "../../../utils";
import { socketsMethodsSharedTestCases } from "../shared/methods.shared.tests";
import { firebaseAdapter, firebaseSocketsAdapter } from "adapter";

describe("Realtime Database Browser [Sockets]", () => {
  socketsMethodsSharedTestCases(
    realtimeDBBrowser,
    seedRealtimeDatabaseBrowser,
    firebaseSocketsAdapter,
    firebaseAdapter,
  );
});
