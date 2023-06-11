import { set, ref } from "firebase/database";

import { firebaseAdapter } from "adapter/index.browser";
import { realtimeDBBrowser, seedRealtimeDatabaseBrowser } from "../../../utils";
import { methodsSharedTestCases } from "../shared/methods.shared.tests";

describe("Realtime Database Browser [ Methods ]", () => {
  beforeEach(async () => {
    await set(ref(realtimeDBBrowser, "teas/"), null);
    await seedRealtimeDatabaseBrowser(realtimeDBBrowser);
  });

  afterEach(async () => {
    await set(ref(realtimeDBBrowser, "teas/"), null);
  });

  methodsSharedTestCases(() => firebaseAdapter(realtimeDBBrowser));
});
