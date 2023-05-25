import { set, ref } from "firebase/database";

import { adapterWeb } from "adapter";
import { realtimeDbWeb } from "./initialize.web";
import { seedRealtimeDatabaseWeb } from "../../utils/seed.web";
import { methodsSharedTestCases } from "../shared/methods.shared.tests";

describe("Realtime Database Web [ Methods ]", () => {
  beforeEach(async () => {
    await set(ref(realtimeDbWeb, "teas/"), null);
    await seedRealtimeDatabaseWeb(realtimeDbWeb);
  });

  afterEach(async () => {
    await set(ref(realtimeDbWeb, "teas/"), null);
  });

  methodsSharedTestCases(() => adapterWeb(realtimeDbWeb));
});
