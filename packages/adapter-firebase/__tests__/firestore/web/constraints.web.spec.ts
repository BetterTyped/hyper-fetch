/**
 * @jest-environment node
 */
import { Client } from "@hyper-fetch/core";

import { firebaseBrowserAdapter } from "adapter";
import { firestoreDbBrowser } from "./initialize.web";
import { seedFirestoreDatabaseBrowser } from "../../utils/seed.web";
import { deleteCollectionForBrowser } from "../../utils/clean.web";
import { constraintsSharedTestCases } from "../shared/constraints.shared.tests";

describe("Firestore Browser [ Constraints ]", () => {
  let client = new Client({ url: "teas/" }).setAdapter(() => firebaseBrowserAdapter(firestoreDbBrowser));

  beforeEach(async () => {
    await seedFirestoreDatabaseBrowser(firestoreDbBrowser);
    client = new Client({ url: "teas/" }).setAdapter(() => firebaseBrowserAdapter(firestoreDbBrowser));
  });

  afterEach(async () => {
    await deleteCollectionForBrowser(firestoreDbBrowser, "teas/");
  });

  constraintsSharedTestCases(client);
});
