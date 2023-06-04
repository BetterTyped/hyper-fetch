import {
  firebaseAdminAdapter,
  firebaseAdapter,
  FirebaseBrowserAdapterTypes,
  FirebaseAdminAdapterTypes,
  FirebaseAdminSocketAdapterTypes,
  FirebaseBrowserSocketAdapterTypes,
} from "adapter";
import { addDocTestSuite } from "./methods/addDoc.test.suite";
import { deleteDocTestSuite } from "./methods/deleteDoc.test.suite";
import { getDocTestSuite } from "./methods/getDoc.test.suite";
import { getDocsTestSuite } from "./methods/getDocs.test.suite";
import { setDocTestSuite } from "./methods/setDoc.test.suite";
import { updateDocTestSuite } from "./methods/updateDoc.test.suite";
import { onSnapshotTestSuite } from "./methods/onSnapshot.test.suite";

export const methodsSharedTestCases = (
  adapterFunction: () => ReturnType<typeof firebaseAdapter> | ReturnType<typeof firebaseAdminAdapter>,
) => {
  addDocTestSuite(adapterFunction);
  deleteDocTestSuite(adapterFunction);
  getDocTestSuite(adapterFunction);
  getDocsTestSuite(adapterFunction);
  setDocTestSuite(adapterFunction);
  updateDocTestSuite(adapterFunction);
};

export const socketsMethodsSharedTestCases = (
  adapter: FirebaseAdminSocketAdapterTypes<any> | FirebaseBrowserSocketAdapterTypes<any>,
  coreAdapter: () => FirebaseBrowserAdapterTypes<any> | FirebaseAdminAdapterTypes<any>,
) => {
  onSnapshotTestSuite(adapter, coreAdapter);
};
