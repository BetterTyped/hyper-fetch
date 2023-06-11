/**
 * @jest-environment node
 */

import { firebaseAdapter, firebaseSocketsAdapter } from "adapter/index.browser";
import { deleteCollectionForBrowser, seedFirestoreDatabaseBrowser } from "../../../utils";
import { firestoreDbBrowser } from "../../../utils/browser/initialize.firestore.browser";
import { socketsMethodsSharedTestCases } from "../shared/methods.shared.tests";

describe("Firestore Database Browser [Sockets]", () => {
  beforeEach(async () => {
    await seedFirestoreDatabaseBrowser(firestoreDbBrowser);
  });
  afterEach(async () => {
    await deleteCollectionForBrowser(firestoreDbBrowser, "teas");
  });
  socketsMethodsSharedTestCases(firebaseSocketsAdapter(firestoreDbBrowser), firebaseAdapter(firestoreDbBrowser));
});
