import { set, ref } from "firebase/database";

import { firebaseBrowserAdapter } from "adapter";
import { realtimeDbBrowser } from "./initialize.web";
import { seedRealtimeDatabaseBrowser } from "../../utils/seed.web";
import { methodsSharedTestCases } from "../shared/methods.shared.tests";

describe("Realtime Database Browser [ Methods ]", () => {
  beforeEach(async () => {
    await set(ref(realtimeDbBrowser, "teas/"), null);
    await seedRealtimeDatabaseBrowser(realtimeDbBrowser);
  });

  afterEach(async () => {
    await set(ref(realtimeDbBrowser, "teas/"), null);
  });

  methodsSharedTestCases(() => firebaseBrowserAdapter(realtimeDbBrowser));
});
