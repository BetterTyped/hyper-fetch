import type { Database } from "firebase/database";
import { set, ref } from "firebase/database";
import type { Firestore } from "firebase/firestore";
import { doc, setDoc } from "firebase/firestore";

import { teas } from "../seed/seed.data";

export const seedRealtimeDatabaseBrowser = async (db: Database) => {
  await set(ref(db, "teas/"), null);
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
