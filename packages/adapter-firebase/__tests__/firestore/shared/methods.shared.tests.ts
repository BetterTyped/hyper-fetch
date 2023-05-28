import { firebaseAdminAdapter, firebaseBrowserAdapter } from "../../../src";
import { addDocTestSuite } from "./methods/addDoc.test.suite";
import { deleteDocTestSuite } from "./methods/deleteDoc.test.suite";
import { getDocTestSuite } from "./methods/getDoc.test.suite";
import { getDocsTestSuite } from "./methods/getDocs.test.suite";
import { onSnapshotTestSuite } from "./methods/onSnapshot.test.suite";
import { setDocTestSuite } from "./methods/setDoc.test.suite";
import { updateDocTestSuite } from "./methods/updateDoc.test.suite";

export const methodsSharedTestCases = (
  adapterFunction: () => ReturnType<typeof firebaseBrowserAdapter> | ReturnType<typeof firebaseAdminAdapter>,
) => {
  addDocTestSuite(adapterFunction);
  deleteDocTestSuite(adapterFunction);
  getDocTestSuite(adapterFunction);
  getDocsTestSuite(adapterFunction);
  onSnapshotTestSuite(adapterFunction);
  setDocTestSuite(adapterFunction);
  updateDocTestSuite(adapterFunction);
};
