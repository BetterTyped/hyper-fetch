/**
 * @jest-environment node
 */

import { firebaseAdapter } from "adapter";
import { seedFirestoreDatabaseBrowser, deleteCollectionForBrowser } from "../../../utils";
import { methodsSharedTestCases } from "../shared/methods.shared.tests";
import { firestoreDbBrowser } from "../../../utils/browser/initialize.firestore.browser";

describe("Firestore Browser [ Methods ]", () => {
  beforeEach(async () => {
    await seedFirestoreDatabaseBrowser(firestoreDbBrowser);
  });

  afterEach(async () => {
    await deleteCollectionForBrowser(firestoreDbBrowser, "teas");
  });

  methodsSharedTestCases(() => firebaseAdapter(firestoreDbBrowser));
});
