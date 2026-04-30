/**
 * @vitest-environment node
 */

import { FirebaseAdapter } from "adapter";

import { deleteCollectionForBrowser } from "../../../utils/browser/clean.browser";
import { firestoreDbBrowser } from "../../../utils/browser/initialize.firestore.browser";
import { seedFirestoreDatabaseBrowser } from "../../../utils/browser/seed.browser";
import { methodsSharedTestCases } from "../shared/methods.shared.tests";

describe("Firestore Browser [ Methods ]", () => {
  beforeEach(async () => {
    await seedFirestoreDatabaseBrowser(firestoreDbBrowser);
  });

  afterEach(async () => {
    await deleteCollectionForBrowser(firestoreDbBrowser, "teas");
  });

  methodsSharedTestCases(() => FirebaseAdapter(firestoreDbBrowser));
});
