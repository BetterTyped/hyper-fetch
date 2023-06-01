import { deleteCollectionForBrowser, seedFirestoreDatabaseBrowser } from "../../utils";
import { firestoreDbBrowser } from "../../utils/browser/initialize.firestore.browser";

describe("Firestore Database Browser [Sockets]", () => {
  beforeEach(async () => {
    await seedFirestoreDatabaseBrowser(firestoreDbBrowser);
  });
  afterEach(async () => {
    await deleteCollectionForBrowser(firestoreDbBrowser, "teas");
  });
  // socketsMethodsSharedTestCases(
  //   () => firebaseSocketsAdapter(firestoreDbBrowser) as FirestoreSocketAdapterType,
  //   () => firebaseAdapter(firestoreDbBrowser),
  // );
});
