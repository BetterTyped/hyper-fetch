import {
  Firestore,
  doc,
  collection,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
} from "@firebase/firestore";

import { FirestoreDBMethods } from "../adapter.types";

export const getFirestoreMethods = (
  database: Firestore,
  url: string,
  onSuccess,
  onError,
  resolve,
): Record<FirestoreDBMethods, (data) => void> => {
  const methods: Record<FirestoreDBMethods, (data) => void> = {
    onSnapshot: async () => {
      // TODO - handle Query -> collection
      const path = doc(database, url);
      // TODO - add onError callback
      const unsub = onSnapshot(path, (snapshot) => {
        onSuccess(snapshot.data(), "success", { ref: path, snapshot, unsubscribe: unsub }, resolve);
      });
    },
    getDoc: async () => {
      const path = doc(database, url);
      try {
        const snapshot = await getDoc(path);
        onSuccess(snapshot.data(), "success", { ref: path, snapshot }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    getDocs: async () => {
      const path = collection(database, url);
      try {
        const snapshots = await getDocs(path);
        // TODO check
        onSuccess(snapshots.docs, "success", { ref: path, snapshot: snapshots }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    setDoc: async (data: any) => {
      const path = doc(database, url);
      try {
        await setDoc(path, data);
        onSuccess(data, "success", { ref: path }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    addDoc: async (data: any) => {
      const path = collection(database, url);
      try {
        const docRef = await addDoc(path, data);
        onSuccess(data, "success", { ref: docRef }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    updateDoc: async (data: any) => {
      const path = doc(database, url);
      try {
        await updateDoc(path, data);
        onSuccess(data, "success", { ref: path }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    deleteDoc: async () => {
      const path = doc(database, url);
      try {
        await deleteDoc(path);
        onSuccess(null, "success", { ref: path }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
  };

  return methods;
};
