import { FirebaseAdminAdapter, FirebaseAdminAdapterTypes, FirebaseAdminSocketAdapterTypes } from "adapter";
import { addDocTestSuite } from "./methods/add-doc.test.suite";
import { deleteDocTestSuite } from "./methods/delete-doc.test.suite";
import { getDocTestSuite } from "./methods/get-doc.test.suite";
import { getDocsTestSuite } from "./methods/get-docs.test.suite";
import { setDocTestSuite } from "./methods/set-doc.test.suite";
import { updateDocTestSuite } from "./methods/update-doc.test.suite";
import { onSnapshotTestSuite } from "./methods/on-snapshot.test.suite";

export const methodsSharedTestCases = (adapterFunction: () => ReturnType<typeof FirebaseAdminAdapter>) => {
  addDocTestSuite(adapterFunction);
  deleteDocTestSuite(adapterFunction);
  getDocTestSuite(adapterFunction);
  getDocsTestSuite(adapterFunction);
  setDocTestSuite(adapterFunction);
  updateDocTestSuite(adapterFunction);
};

export const socketsMethodsSharedTestCases = (
  adapter: FirebaseAdminSocketAdapterTypes<any>,
  coreAdapter: FirebaseAdminAdapterTypes<any>,
) => {
  onSnapshotTestSuite(adapter, coreAdapter);
};
