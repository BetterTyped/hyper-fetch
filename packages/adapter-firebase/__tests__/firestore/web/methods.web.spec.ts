/**
 * @jest-environment node
 */

import { firestoreDbWeb } from "./initialize.web";
import { seedFirestoreDatabaseWeb } from "../../utils/seed.web";
import { deleteCollectionForWeb } from "../../utils/clean.web";
import { methodsSharedTestCases } from "../shared/methods.shared.tests";
import { firebaseWebAdapter } from "../../../src";

describe("Firestore Web [ Methods ]", () => {
  beforeEach(async () => {
    await seedFirestoreDatabaseWeb(firestoreDbWeb);
  });

  afterEach(async () => {
    await deleteCollectionForWeb(firestoreDbWeb, "teas");
  });

  methodsSharedTestCases(() => firebaseWebAdapter(firestoreDbWeb));
});
