import { getDatabase, connectDatabaseEmulator, ref, set } from "firebase/database";
import { getFirestore, connectFirestoreEmulator, collection, addDoc, setDoc, doc, getDoc, initializeFirestore } from "firebase/firestore";
import { initializeApp, setLogLevel } from 'firebase/app'

jest.setTimeout(20000)

describe('it should work', () => {
  let app;
  let db;
  let firestore;

  beforeAll(async () => {
    app = initializeApp({
      projectId: 'demo-test'
    })
    setLogLevel('debug')
    initializeFirestore(app, {experimentalAutoDetectLongPolling: true}, 'local')
    firestore = getFirestore()
    // db = getDatabase();
    // connectDatabaseEmulator(db, '127.0.0.1', 9000)
    connectFirestoreEmulator(firestore, '127.0.0.1',8082);
  });

  beforeEach(async () => {
    // await set(ref(db), null)
  });
  it('it really should work', async () => {
    // await set(ref(db, 'users/'), {test: 'data22'})
    const docRef = doc(firestore, "cities", "SF");
    const docSnap = await getDoc(docRef);
    console.log("???")
  })
})
