import { Database, set, ref } from "firebase/database";
import { Firestore, doc, setDoc } from "firebase/firestore";

import { teas } from "./seed.data";

export const seedRealtimeDatabaseBrowser = async (db: Database) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const tea of teas) {
    const { id, ...data } = tea;
    // eslint-disable-next-line no-await-in-loop
    await set(ref(db, `teas/${id}`), data);
  }
};

export const seedFirestoreDatabaseBrowser = async (db: Firestore) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const tea of teas) {
    const { id, ...data } = tea;
    // eslint-disable-next-line no-await-in-loop
    await setDoc(doc(db, "teas", `${id}`), data);
  }
};
