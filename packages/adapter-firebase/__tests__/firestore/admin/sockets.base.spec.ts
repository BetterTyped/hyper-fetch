/**
 * @jest-environment node
 */

import { seedFirestoreDatabaseAdmin } from "../../utils/admin/seed.admin";
import { firestoreDbAdmin } from "../../utils/admin/initialize.firestore.admin";
import { socketsMethodsSharedTestCases } from "../shared/methods.shared.tests";
import { firebaseAdminAdapter } from "../../../src";
import { firebaseSocketsAdminAdapter } from "../../../src/adapter/admin/adapter.admin.sockets";
import { FirestoreAdminSocketAdapterType } from "../../../src/adapter/types/firestore.admin.types";

describe("Firestore Admin [ Sockets ]", () => {
  beforeEach(async () => {
    await firestoreDbAdmin.recursiveDelete(firestoreDbAdmin.collection("teas"));
    await seedFirestoreDatabaseAdmin(firestoreDbAdmin);
  });

  socketsMethodsSharedTestCases(
    () => firebaseSocketsAdminAdapter(firestoreDbAdmin) as FirestoreAdminSocketAdapterType,
    () => firebaseAdminAdapter(firestoreDbAdmin),
  );
});
