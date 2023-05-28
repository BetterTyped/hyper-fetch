/**
 * @jest-environment node
 */

import { firestoreDbBrowser } from "./initialize.web";
import { seedFirestoreDatabaseBrowser } from "../../utils/seed.web";
import { deleteCollectionForBrowser } from "../../utils/clean.web";
import { methodsSharedTestCases } from "../shared/methods.shared.tests";
import { firebaseBrowserAdapter } from "../../../src";

describe("Firestore Browser [ Methods ]", () => {
  beforeEach(async () => {
    await seedFirestoreDatabaseBrowser(firestoreDbBrowser);
  });

  afterEach(async () => {
    await deleteCollectionForBrowser(firestoreDbBrowser, "teas");
  });

  methodsSharedTestCases(() => firebaseBrowserAdapter(firestoreDbBrowser));
});
