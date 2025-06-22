import { Client } from "@hyper-fetch/core";
import { Socket } from "@hyper-fetch/sockets";
import { FirebaseAdapter, FirebaseSocketsAdapter } from "@hyper-fetch/firebase";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const client = new Client({ url: "" }).setAdapter(FirebaseAdapter(db));

export const socket = new Socket({ url: "", adapter: FirebaseSocketsAdapter(db) });
