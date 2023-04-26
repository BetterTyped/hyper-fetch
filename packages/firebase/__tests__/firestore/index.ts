import { initializeApp, setLogLevel } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const initializeFirestore = () => {
  const app = initializeApp({
    projectId: "demo-test-firestore",
  });

  const db = getFirestore(app);
  connectFirestoreEmulator(db, "127.0.0.1", 8080);

  setLogLevel("debug");

  return db;
};

export const firestoreDb = initializeFirestore();
