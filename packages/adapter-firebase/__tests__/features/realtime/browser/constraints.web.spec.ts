import { ref, set } from "firebase/database";

import { FirebaseAdapter } from "adapter";
import { realtimeDBBrowser, seedRealtimeDatabaseBrowser } from "../../../utils";
import { constraintsSharedTestCases } from "../shared/constraints.shared.tests";

describe("Realtime Database Browser [Constraints]", () => {
  beforeEach(async () => {
    await set(ref(realtimeDBBrowser, "teas/"), null);
    await seedRealtimeDatabaseBrowser(realtimeDBBrowser);
  });

  constraintsSharedTestCases(() => FirebaseAdapter(realtimeDBBrowser));
});
