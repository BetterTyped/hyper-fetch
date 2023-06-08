/**
 * @jest-environment node
 */

import { seedFirestoreDatabaseAdmin } from "../../../utils";
import { firestoreDbAdmin } from "../../../utils/admin/initialize.firestore.admin";
import { socketsMethodsSharedTestCases } from "../shared/methods.shared.tests";
import { firebaseSocketsAdminAdapter, firebaseAdminAdapter } from "adapter";

describe("Firestore Admin [ Sockets ]", () => {
  beforeEach(async () => {
    await firestoreDbAdmin.recursiveDelete(firestoreDbAdmin.collection("teas"));
    await seedFirestoreDatabaseAdmin(firestoreDbAdmin);
  });

  socketsMethodsSharedTestCases(firebaseSocketsAdminAdapter(firestoreDbAdmin), firebaseAdminAdapter(firestoreDbAdmin));
});
