import { FirebaseAdapter, FirebaseAdapterTypes, FirebaseSocketAdapterTypes } from "adapter";
import { addDocTestSuite } from "./methods/add-doc.test.suite";
import { onSnapshotTestSuite } from "./methods/on-snapshot.test.suite";
import { deleteDocTestSuite } from "./methods/delete-doc.test.suite";
import { getDocTestSuite } from "./methods/get-doc.test.suite";
import { getDocsTestSuite } from "./methods/get-docs.test.suite";
import { setDocTestSuite } from "./methods/set-doc.test.suite";
import { updateDocTestSuite } from "./methods/update-doc.test.suite";

export const methodsSharedTestCases = (adapterFunction: () => ReturnType<typeof FirebaseAdapter>) => {
  addDocTestSuite(adapterFunction);
  deleteDocTestSuite(adapterFunction);
  getDocTestSuite(adapterFunction);
  getDocsTestSuite(adapterFunction);
  setDocTestSuite(adapterFunction);
  updateDocTestSuite(adapterFunction);
};

export const socketsMethodsSharedTestCases = (
  adapter: FirebaseSocketAdapterTypes<any>,
  coreAdapter: () => FirebaseAdapterTypes<any>,
) => {
  onSnapshotTestSuite(adapter, coreAdapter);
};
