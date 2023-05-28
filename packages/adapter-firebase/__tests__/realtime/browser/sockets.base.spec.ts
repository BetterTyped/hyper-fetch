import { set, ref } from "firebase/database";

import { realtimeDBBrowser, seedRealtimeDatabaseBrowser } from "../../utils";
import { socketsMethodsSharedTestCases } from "../shared/methods.shared.tests";
import { firebaseAdapter, firebaseSocketsAdapter } from "adapter";

describe("Realtime Database Browser [Sockets]", () => {
  beforeEach(async () => {
    await set(ref(realtimeDBBrowser, "teas/"), null);
    await seedRealtimeDatabaseBrowser(realtimeDBBrowser);
  });
  socketsMethodsSharedTestCases(firebaseSocketsAdapter(realtimeDBBrowser), () => firebaseAdapter(realtimeDBBrowser));
});
