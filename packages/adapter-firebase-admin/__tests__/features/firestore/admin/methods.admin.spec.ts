/**
 * @jest-environment node
 */

import { seedFirestoreDatabaseAdmin } from "../../../utils/seed.admin";
import { firestoreDbAdmin } from "../../../utils/initialize.firestore.admin";
import { methodsSharedTestCases } from "../shared/methods.shared.tests";
import { firebaseAdminAdapter } from "adapter";

describe("Firestore Admin [ Methods ]", () => {
  beforeEach(async () => {
    await firestoreDbAdmin.recursiveDelete(firestoreDbAdmin.collection("teas"));
    await seedFirestoreDatabaseAdmin(firestoreDbAdmin);
  });

  afterEach(async () => {
    await firestoreDbAdmin.recursiveDelete(firestoreDbAdmin.collection("teas"));
  });
  methodsSharedTestCases(() => firebaseAdminAdapter(firestoreDbAdmin));
});
