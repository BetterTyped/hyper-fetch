/**
 * @vitest-environment node
 */

import { FirebaseSocketsAdminAdapter, FirebaseAdminAdapter } from "adapter";

import { seedFirestoreDatabaseAdmin } from "../../../utils";
import { firestoreDbAdmin } from "../../../utils/initialize.firestore.admin";
import { socketsMethodsSharedTestCases } from "../shared/methods.shared.tests";

describe("Firestore Admin [ Sockets ]", () => {
  beforeEach(async () => {
    await firestoreDbAdmin.recursiveDelete(firestoreDbAdmin.collection("teas"));
    await seedFirestoreDatabaseAdmin(firestoreDbAdmin);
  });

  socketsMethodsSharedTestCases(FirebaseSocketsAdminAdapter(firestoreDbAdmin), FirebaseAdminAdapter(firestoreDbAdmin));
});
