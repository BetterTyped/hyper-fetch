/**
 * @jest-environment node
 */
import { Client } from "@hyper-fetch/core";

import { firebaseAdapter } from "adapter";
import { firestoreDbBrowser } from "../../../utils/browser/initialize.firestore.browser";
import { seedFirestoreDatabaseBrowser } from "../../../utils/browser/seed.browser";
import { deleteCollectionForBrowser } from "../../../utils/browser/clean.browser";
import { constraintsSharedTestCases } from "../shared/constraints.shared.tests";

describe("Firestore Browser [ Constraints ]", () => {
  let client = new Client({ url: "teas/" }).setAdapter(firebaseAdapter(firestoreDbBrowser));

  beforeEach(async () => {
    await seedFirestoreDatabaseBrowser(firestoreDbBrowser);
    client = new Client({ url: "teas/" }).setAdapter(firebaseAdapter(firestoreDbBrowser));
  });

  afterEach(async () => {
    await deleteCollectionForBrowser(firestoreDbBrowser, "teas/");
  });

  constraintsSharedTestCases(client);
});
