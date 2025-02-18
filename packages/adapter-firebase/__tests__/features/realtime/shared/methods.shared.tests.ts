/* eslint-disable max-params */
import { FirebaseAdapter, FirebaseAdapterTypes, FirebaseDBTypes, FirebaseSocketAdapterTypes } from "adapter";
import { pushTestSuite } from "./methods/push.test.suite";
import { onValueTestSuite } from "./methods/on-value.test.suite";
import { getTestSuite } from "./methods/get.test.suite";
import { setTestSuite } from "./methods/set.test.suite";
import { updateTestSuite } from "./methods/update.test.suite";
import { removeTestSuite } from "./methods/remove.test.suite";

export const methodsSharedTestCases = (adapterFunction: () => ReturnType<typeof FirebaseAdapter>) => {
  getTestSuite(adapterFunction);
  setTestSuite(adapterFunction);
  pushTestSuite(adapterFunction);
  updateTestSuite(adapterFunction);
  removeTestSuite(adapterFunction);
};

export const socketsMethodsSharedTestCases = (
  db: FirebaseDBTypes,
  seedDbMethod: (db: any) => Promise<void>,
  socketsAdapter: (database: FirebaseDBTypes) => FirebaseSocketAdapterTypes<any>,
  coreAdapter: (database: FirebaseDBTypes) => FirebaseAdapterTypes<any>,
) => {
  onValueTestSuite(db, seedDbMethod, socketsAdapter, coreAdapter);
};
