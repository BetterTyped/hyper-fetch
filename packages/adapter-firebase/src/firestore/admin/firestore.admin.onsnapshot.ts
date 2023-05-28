import { RequestInstance } from "@hyper-fetch/core";
import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Firestore,
  Query,
} from "firebase-admin/lib/firestore";

import { FirestoreConstraintsUnion, FirestorePermittedMethods, PermittedConstraints } from "constraints";
import { applyConstraints, getRef } from "./firestore.admin.utils";
import { getGroupedResultFirestore, getOrderedResultFirestore } from "../utils/firestore.utils";
import { getStatus, setCacheManually } from "utils";

export const onSnapshot =
  (request: RequestInstance, database: Firestore, url: string) =>
  async ({
    constraints = [],
    options,
  }: {
    constraints: PermittedConstraints<FirestorePermittedMethods, FirestoreConstraintsUnion>[];
    options?: Record<string, any>;
  }) => {
    const [cleanUrl] = url.split("?");
    // includeMetadataChanges: true option
    let pathRef: DocumentReference | Query = getRef(database, cleanUrl);
    if (pathRef instanceof CollectionReference) {
      pathRef = applyConstraints(pathRef, constraints);
    }
    const unsub = pathRef.onSnapshot(
      (snapshot) => {
        const result =
          snapshot instanceof DocumentSnapshot ? snapshot.data() || null : getOrderedResultFirestore(snapshot);
        const status = getStatus(result);
        const groupedResult = options?.groupByChangeType === true ? getGroupedResultFirestore(snapshot) : null;
        const extra = { ref: pathRef, snapshot, unsubscribe: unsub, groupedResult };
        setCacheManually(request, { value: result, status }, extra);
        // onSuccess(result, status, extra, resolve);
      },
      (error) => {
        const extra = { ref: pathRef, unsubscribe: unsub };
        setCacheManually(request, { value: error, status: "error" }, extra);
        // onError
      },
    );
  };
