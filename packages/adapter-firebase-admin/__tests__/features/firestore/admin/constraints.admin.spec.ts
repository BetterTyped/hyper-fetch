/**
 * @jest-environment node
 */
import { Client } from "@hyper-fetch/core";

import { seedFirestoreDatabaseAdmin } from "../../../utils";
import { firestoreDbAdmin } from "../../../utils/initialize.firestore.admin";
import { constraintsSharedTestCases } from "../shared/constraints.shared.tests";
import { FirebaseAdminAdapter } from "adapter";

describe("Firestore Admin [ Constraints ]", () => {
  const client = new Client({ url: "teas/" }).setAdapter(FirebaseAdminAdapter(firestoreDbAdmin));

  beforeEach(async () => {
    await seedFirestoreDatabaseAdmin(firestoreDbAdmin);
  });

  afterEach(async () => {
    await firestoreDbAdmin.recursiveDelete(firestoreDbAdmin.collection("teas"));
  });

  constraintsSharedTestCases(client);
});
