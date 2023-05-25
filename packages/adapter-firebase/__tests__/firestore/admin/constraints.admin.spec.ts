/**
 * @jest-environment node
 */
import { Client } from "@hyper-fetch/core";

import { seedFirestoreDatabaseAdmin } from "../../utils/seed.admin";
import { firestoreDbAdmin } from "./initialize.admin";
import { adapterAdmin } from "adapter";
import { constraintsSharedTestCases } from "../shared/constraints.shared.tests";

describe("Firestore Admin [ Constraints ]", () => {
  const client = new Client({ url: "teas/" }).setAdapter(() => adapterAdmin(firestoreDbAdmin));

  beforeEach(async () => {
    await seedFirestoreDatabaseAdmin(firestoreDbAdmin);
  });

  afterEach(async () => {
    await firestoreDbAdmin.recursiveDelete(firestoreDbAdmin.collection("teas"));
  });

  constraintsSharedTestCases(client);
});
