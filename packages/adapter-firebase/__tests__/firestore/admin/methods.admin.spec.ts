/**
 * @jest-environment node
 */

import { seedFirestoreDatabaseAdmin } from "../../utils/admin/seed.admin";
import { firestoreDbAdmin } from "./initialize.admin";
import { methodsSharedTestCases } from "../shared/methods.shared.tests";
import { firebaseAdminAdapter } from "../../../src";

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
