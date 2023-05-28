import { ref, set } from "firebase/database";

import { realtimeDbBrowser } from "./initialize.web";
import { firebaseBrowserAdapter } from "adapter";
import { seedRealtimeDatabaseBrowser } from "../../utils/seed.web";
import { constraintsSharedTestCases } from "../shared/constraints.shared.tests";

describe("Realtime Database Browser [Constraints]", () => {
  beforeEach(async () => {
    await set(ref(realtimeDbBrowser, "teas/"), null);
    await seedRealtimeDatabaseBrowser(realtimeDbBrowser);
  });

  constraintsSharedTestCases(() => firebaseBrowserAdapter(realtimeDbBrowser));
});
