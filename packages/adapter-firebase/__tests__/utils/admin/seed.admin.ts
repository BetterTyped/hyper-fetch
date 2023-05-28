import { Firestore } from "firebase-admin/firestore";
import { Database } from "firebase-admin/database";

import { teas } from "../seed/seed.data";

export const seedFirestoreDatabaseAdmin = async (db: Firestore) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const tea of teas) {
    const { id, ...data } = tea;
    // eslint-disable-next-line no-await-in-loop
    await db.collection("teas").doc(`${id}`).set(data);
  }
};

export const seedRealtimeDatabaseAdmin = async (db: Database) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const tea of teas) {
    const { id, ...data } = tea;
    // eslint-disable-next-line no-await-in-loop
    await db.ref(`teas/${id}`).set(data);
  }
};
