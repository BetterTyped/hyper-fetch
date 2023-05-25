import { ref, set } from "firebase/database";

import { realtimeDbWeb } from "./initialize.web";
import { adapterWeb } from "adapter";
import { seedRealtimeDatabaseWeb } from "../../utils/seed.web";
import { constraintsSharedTestCases } from "../shared/constraints.shared.tests";

describe("Realtime Database Web [Constraints]", () => {
  beforeEach(async () => {
    await set(ref(realtimeDbWeb, "teas/"), null);
    await seedRealtimeDatabaseWeb(realtimeDbWeb);
  });

  constraintsSharedTestCases(() => adapterWeb(realtimeDbWeb));
});
