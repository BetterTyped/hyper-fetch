import { set, ref } from "firebase/database";

import { FirebaseAdapter } from "adapter";
import { realtimeDBBrowser } from "../../../utils";
import { seedRealtimeDatabaseBrowser } from "../../../utils/browser/seed.browser";
import { methodsSharedTestCases } from "../shared/methods.shared.tests";

describe("Realtime Database Browser [ Methods ]", () => {
  beforeEach(async () => {
    await set(ref(realtimeDBBrowser, "teas/"), null);
    await seedRealtimeDatabaseBrowser(realtimeDBBrowser);
  });

  afterEach(async () => {
    await set(ref(realtimeDBBrowser, "teas/"), null);
  });

  methodsSharedTestCases(() => FirebaseAdapter(realtimeDBBrowser));
});
