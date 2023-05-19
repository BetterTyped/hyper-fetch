/**
 * @jest-environment node
 */
import { Client } from "@hyper-fetch/core";

import { firebaseWebAdapter } from "adapter";
import { firestoreDbWeb } from "./initialize.web";
import { seedFirestoreDatabaseWeb } from "../../utils/seed.web";
import { deleteCollectionForWeb } from "../../utils/clean.web";
import { constraintsSharedTestCases } from "../shared/constraints.shared.tests";

describe("Firestore Web [ Constraints ]", () => {
  let client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(firestoreDbWeb));

  beforeEach(async () => {
    await seedFirestoreDatabaseWeb(firestoreDbWeb);
    client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(firestoreDbWeb));
  });

  afterEach(async () => {
    await deleteCollectionForWeb(firestoreDbWeb, "teas/");
  });

  constraintsSharedTestCases(client);
});
