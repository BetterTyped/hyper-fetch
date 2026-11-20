import type { FirebaseDBTypes, FirebaseSocketAdapterTypes } from "adapter/index";
import { Database } from "firebase/database";
import { Firestore } from "firebase/firestore";
import { firestoreSockets } from "firestore";
import { realtimeSockets } from "realtime";

/**
 * Socket adapter for live data from the Firebase Web SDK: Firestore `onSnapshot` or Realtime Database `onValue`.
 *
 * Create one adapter per socket. The listener topic is appended to `socket.url`, listener `options` take `constraints`
 * plus `groupByChangeType` (Firestore) or `onlyOnce` (Realtime Database), and every snapshot is delivered as the full
 * current result. `connect()` and `disconnect()` toggle the network of the whole Firebase instance.
 *
 * @param database - Instance from `getFirestore()` or `getDatabase()`
 * @example
 * const socket = new Socket({ url: "teas/", adapter: FirebaseSocketsAdapter(getFirestore(app)) });
 * const onGreenTeas = socket.createListener<Tea[]>()({
 *   topic: "",
 *   options: { constraints: [$where("type", "==", "Green")] },
 * });
 * const stop = onGreenTeas.listen(({ data }) => render(data));
 */
export const FirebaseSocketsAdapter = <T extends FirebaseDBTypes>(database: T): FirebaseSocketAdapterTypes<T> => {
  if (database instanceof Database) {
    return realtimeSockets(database) as unknown as FirebaseSocketAdapterTypes<T>;
  }
  if (database instanceof Firestore) {
    return firestoreSockets(database) as unknown as FirebaseSocketAdapterTypes<T>;
  }
  throw new Error("Unknown database type");
};
