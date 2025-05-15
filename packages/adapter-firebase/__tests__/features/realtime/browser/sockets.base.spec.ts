import { realtimeDBBrowser, seedRealtimeDatabaseBrowser } from "../../../utils";
import { socketsMethodsSharedTestCases } from "../shared/methods.shared.tests";
import { FirebaseAdapter, FirebaseSocketsAdapter } from "adapter";

describe("Realtime Database Browser [Sockets]", () => {
  socketsMethodsSharedTestCases(
    realtimeDBBrowser,
    seedRealtimeDatabaseBrowser,
    FirebaseSocketsAdapter,
    FirebaseAdapter,
  );
});
