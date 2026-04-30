import { FirebaseAdapter, FirebaseSocketsAdapter } from "adapter";

import { realtimeDBBrowser, seedRealtimeDatabaseBrowser } from "../../../utils";
import { socketsMethodsSharedTestCases } from "../shared/methods.shared.tests";

describe("Realtime Database Browser [Sockets]", () => {
  socketsMethodsSharedTestCases(
    realtimeDBBrowser,
    seedRealtimeDatabaseBrowser,
    FirebaseSocketsAdapter,
    FirebaseAdapter,
  );
});
