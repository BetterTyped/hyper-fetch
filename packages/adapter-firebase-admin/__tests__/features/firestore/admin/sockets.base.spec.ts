/**
 * @jest-environment node
 */

import { seedFirestoreDatabaseAdmin } from "../../../utils";
import { firestoreDbAdmin } from "../../../utils/initialize.firestore.admin";
import { socketsMethodsSharedTestCases } from "../shared/methods.shared.tests";
import { firebaseSocketsAdminAdapter, firebaseAdminAdapter } from "adapter";

describe("Firestore Admin [ Sockets ]", () => {
  beforeEach(async () => {
    await firestoreDbAdmin.recursiveDelete(firestoreDbAdmin.collection("teas"));
    await seedFirestoreDatabaseAdmin(firestoreDbAdmin);
  });

  socketsMethodsSharedTestCases(firebaseSocketsAdminAdapter(firestoreDbAdmin), firebaseAdminAdapter(firestoreDbAdmin));
});
