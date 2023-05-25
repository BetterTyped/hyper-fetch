/**
 * @jest-environment node
 */

import { seedFirestoreDatabaseAdmin } from "../../utils/seed.admin";
import { firestoreDbAdmin } from "./initialize.admin";
import { methodsSharedTestCases } from "../shared/methods.shared.tests";
import { adapterAdmin } from "../../../src";

describe("Firestore Admin [ Methods ]", () => {
  beforeEach(async () => {
    await firestoreDbAdmin.recursiveDelete(firestoreDbAdmin.collection("teas"));
    await seedFirestoreDatabaseAdmin(firestoreDbAdmin);
  });

  afterEach(async () => {
    await firestoreDbAdmin.recursiveDelete(firestoreDbAdmin.collection("teas"));
  });
  methodsSharedTestCases(() => adapterAdmin(firestoreDbAdmin));
});
