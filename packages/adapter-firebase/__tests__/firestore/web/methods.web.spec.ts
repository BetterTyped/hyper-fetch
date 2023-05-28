/**
 * @jest-environment node
 */

import { firestoreDbBrowser } from "./initialize.web";
import { seedFirestoreDatabaseBrowser } from "../../utils/browser/seed.browser";
import { deleteCollectionForBrowser } from "../../utils/browser/clean.browser";
import { methodsSharedTestCases } from "../shared/methods.shared.tests";
import { firebaseAdapter } from "../../../src";

describe("Firestore Browser [ Methods ]", () => {
  beforeEach(async () => {
    await seedFirestoreDatabaseBrowser(firestoreDbBrowser);
  });

  afterEach(async () => {
    await deleteCollectionForBrowser(firestoreDbBrowser, "teas");
  });

  methodsSharedTestCases(() => firebaseAdapter(firestoreDbBrowser));
});
