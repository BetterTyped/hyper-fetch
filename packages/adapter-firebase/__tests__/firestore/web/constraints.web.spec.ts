/**
 * @jest-environment node
 */
import { Client } from "@hyper-fetch/core";

import { adapterWeb } from "adapter";
import { firestoreDbWeb } from "./initialize.web";
import { seedFirestoreDatabaseWeb } from "../../utils/seed.web";
import { deleteCollectionForWeb } from "../../utils/clean.web";
import { constraintsSharedTestCases } from "../shared/constraints.shared.tests";

describe("Firestore Web [ Constraints ]", () => {
  let client = new Client({ url: "teas/" }).setAdapter(() => adapterWeb(firestoreDbWeb));

  beforeEach(async () => {
    await seedFirestoreDatabaseWeb(firestoreDbWeb);
    client = new Client({ url: "teas/" }).setAdapter(() => adapterWeb(firestoreDbWeb));
  });

  afterEach(async () => {
    await deleteCollectionForWeb(firestoreDbWeb, "teas/");
  });

  constraintsSharedTestCases(client);
});
