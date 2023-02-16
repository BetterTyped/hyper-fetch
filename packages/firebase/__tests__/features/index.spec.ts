import { initializeApp, setLogLevel } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, addDoc, collection, doc, getDoc } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const app = initializeApp({
  projectId: "demo-test",
});

const db = getFirestore(app);
// const auth = getAuth(app);
setLogLevel("debug");
// connectAuthEmulator(auth, "http://localhost:9099");
connectFirestoreEmulator(db, "localhost", 8080);

jest.setTimeout(10000);

describe("Works", () => {
  test("loads and returns data from server", async () => {
    console.log(1);
    const docRef = await addDoc(collection(db, "entries"), { foo: "bar" });
    console.log(2);
    const docSnapshot = await getDoc(docRef);
    console.log(3);

    expect(docSnapshot[0]?.data()).toEqual({ name: "bar" });
  });
});
