import { firebaseAdminAdapter, firebaseWebAdapter } from "adapter";
import { getTestSuite } from "./methods/get.test.suite";
import { setTestSuite } from "./methods/set.test.suite";
import { pushTestSuite } from "./methods/push.test.suite";
import { updateTestSuite } from "./methods/update.test.suite";
import { removeTestSuite } from "./methods/remove.test.suite";

export const methodsSharedTestCases = (
  adapterFunction: () => ReturnType<typeof firebaseWebAdapter> | ReturnType<typeof firebaseAdminAdapter>,
) => {
  getTestSuite(adapterFunction);
  setTestSuite(adapterFunction);
  pushTestSuite(adapterFunction);
  updateTestSuite(adapterFunction);
  removeTestSuite(adapterFunction);
};
