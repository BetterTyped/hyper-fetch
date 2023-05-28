import { firebaseAdminAdapter, firebaseBrowserAdapter } from "adapter";
import { getTestSuite } from "./methods/get.test.suite";
import { setTestSuite } from "./methods/set.test.suite";
import { pushTestSuite } from "./methods/push.test.suite";
import { updateTestSuite } from "./methods/update.test.suite";
import { removeTestSuite } from "./methods/remove.test.suite";
import { onValueTestSuite } from "./methods/onValue.test.suite";
import { RealtimeSocketAdapterType } from "realtime";

export const methodsSharedTestCases = (
  adapterFunction: () => ReturnType<typeof firebaseBrowserAdapter> | ReturnType<typeof firebaseAdminAdapter>,
) => {
  getTestSuite(adapterFunction);
  setTestSuite(adapterFunction);
  pushTestSuite(adapterFunction);
  updateTestSuite(adapterFunction);
  removeTestSuite(adapterFunction);
};

export const socketsMethodsSharedTestCases = (
  adapter: RealtimeSocketAdapterType,
  coreAdapter: () => ReturnType<typeof firebaseBrowserAdapter> | ReturnType<typeof firebaseAdminAdapter>,
) => {
  onValueTestSuite(adapter, coreAdapter);
};
