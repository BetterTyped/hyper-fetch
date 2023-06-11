import { ref, set } from "firebase/database";

import { firebaseAdapter } from "adapter/index.browser";
import { realtimeDBBrowser, seedRealtimeDatabaseBrowser } from "../../../utils";
import { constraintsSharedTestCases } from "../shared/constraints.shared.tests";

describe("Realtime Database Browser [Constraints]", () => {
  beforeEach(async () => {
    await set(ref(realtimeDBBrowser, "teas/"), null);
    await seedRealtimeDatabaseBrowser(realtimeDBBrowser);
  });

  constraintsSharedTestCases(() => firebaseAdapter(realtimeDBBrowser));
});
