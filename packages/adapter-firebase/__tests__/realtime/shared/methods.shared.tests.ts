import { adapterAdmin, adapterWeb } from "adapter";
import { onValueTestSuite } from "./methods/onValue.test.suite";
import { getTestSuite } from "./methods/get.test.suite";
import { setTestSuite } from "./methods/set.test.suite";
import { pushTestSuite } from "./methods/push.test.suite";
import { updateTestSuite } from "./methods/update.test.suite";
import { removeTestSuite } from "./methods/remove.test.suite";

export const methodsSharedTestCases = (
  adapterFunction: () => ReturnType<typeof adapterWeb> | ReturnType<typeof adapterAdmin>,
) => {
  onValueTestSuite(adapterFunction);
  getTestSuite(adapterFunction);
  setTestSuite(adapterFunction);
  pushTestSuite(adapterFunction);
  updateTestSuite(adapterFunction);
  removeTestSuite(adapterFunction);
};
