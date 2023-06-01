/**
 * @jest-environment node
 */
import { Client } from "@hyper-fetch/core";

import { seedFirestoreDatabaseAdmin } from "../../utils/admin/seed.admin";
import { firestoreDbAdmin } from "../../utils/admin/initialize.firestore.admin";
import { firebaseAdminAdapter } from "adapter";
import { constraintsSharedTestCases } from "../shared/constraints.shared.tests";

describe("Firestore Admin [ Constraints ]", () => {
  const client = new Client({ url: "teas/" }).setAdapter(() => firebaseAdminAdapter(firestoreDbAdmin));

  beforeEach(async () => {
    await seedFirestoreDatabaseAdmin(firestoreDbAdmin);
  });

  afterEach(async () => {
    await firestoreDbAdmin.recursiveDelete(firestoreDbAdmin.collection("teas"));
  });

  constraintsSharedTestCases(client);
});
