import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const initializeFirestore = () => {
  process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
  const app = initializeApp({
    projectId: "demo-test-firestore",
  });

  return getFirestore(app);
};

export const firestoreDbAdmin = initializeFirestore();
