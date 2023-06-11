/**
 * @jest-environment node
 */

import { seedFirestoreDatabaseAdmin } from "../../../utils";
import { firestoreDbAdmin } from "../../../utils/admin/initialize.firestore.admin";
import { methodsSharedTestCases } from "../shared/methods.shared.tests";
import { firebaseAdminAdapter } from "adapter/index.server";

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
