/**
 * @jest-environment node
 */

import { seedFirestoreDatabaseBrowser } from "../../utils/browser/seed.browser";
import { deleteCollectionForBrowser } from "../../utils/browser/clean.browser";
import { methodsSharedTestCases } from "../shared/methods.shared.tests";
import { firebaseAdapter } from "adapter";
import { firestoreDbBrowser } from "../../utils/browser/initialize.firestore.browser";

describe("Firestore Browser [ Methods ]", () => {
  beforeEach(async () => {
    await seedFirestoreDatabaseBrowser(firestoreDbBrowser);
  });

  afterEach(async () => {
    await deleteCollectionForBrowser(firestoreDbBrowser, "teas");
  });

  methodsSharedTestCases(() => firebaseAdapter(firestoreDbBrowser));
});
