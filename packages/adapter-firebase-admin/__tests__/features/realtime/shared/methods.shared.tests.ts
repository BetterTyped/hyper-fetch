/* eslint-disable max-params */
import { FirebaseAdminAdapter, FirebaseAdminAdapterTypes, FirebaseAdminSocketAdapterTypes } from "adapter";
import { getTestSuite } from "./methods/get.test.suite";
import { setTestSuite } from "./methods/set.test.suite";
import { pushTestSuite } from "./methods/push.test.suite";
import { updateTestSuite } from "./methods/update.test.suite";
import { removeTestSuite } from "./methods/remove.test.suite";
import { onValueTestSuite } from "./methods/on-value.test.suite";

export const methodsSharedTestCases = (adapterFunction: () => ReturnType<typeof FirebaseAdminAdapter>) => {
  getTestSuite(adapterFunction);
  setTestSuite(adapterFunction);
  pushTestSuite(adapterFunction);
  updateTestSuite(adapterFunction);
  removeTestSuite(adapterFunction);
};

export const socketsMethodsSharedTestCases = (
  db: any,
  seedDbMethod: (db: any) => Promise<void>,
  socketsAdapter: (database: any) => FirebaseAdminSocketAdapterTypes<any>,
  coreAdapter: (database: any) => FirebaseAdminAdapterTypes<any>,
) => {
  onValueTestSuite(db, seedDbMethod, socketsAdapter, coreAdapter);
};
