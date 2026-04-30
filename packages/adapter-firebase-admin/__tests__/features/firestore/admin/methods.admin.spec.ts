/**
 * @vitest-environment node
 */

import { FirebaseAdminAdapter } from "adapter";

import { seedFirestoreDatabaseAdmin } from "../../../utils";
import { firestoreDbAdmin } from "../../../utils/initialize.firestore.admin";
import { methodsSharedTestCases } from "../shared/methods.shared.tests";

describe("Firestore Admin [ Methods ]", () => {
  beforeEach(async () => {
    await firestoreDbAdmin.recursiveDelete(firestoreDbAdmin.collection("teas"));
    await seedFirestoreDatabaseAdmin(firestoreDbAdmin);
  });

  afterEach(async () => {
    await firestoreDbAdmin.recursiveDelete(firestoreDbAdmin.collection("teas"));
  });
  methodsSharedTestCases(() => FirebaseAdminAdapter(firestoreDbAdmin));
});
