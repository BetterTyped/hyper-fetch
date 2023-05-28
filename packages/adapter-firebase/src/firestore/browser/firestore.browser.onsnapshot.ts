import { RequestInstance } from "@hyper-fetch/core";
import { collection, doc, query, onSnapshot as _onSnapshot, Firestore } from "firebase/firestore";

import { FirestoreConstraintsUnion, FirestorePermittedMethods, PermittedConstraints } from "constraints";
import { getStatus, isDocOrQuery, setCacheManually } from "utils";
import { mapConstraint } from "./firestore.browser.utils";
import { getGroupedResultFirestore, getOrderedResultFirestore } from "../utils/firestore.utils";

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
    let path;
    const queryType = isDocOrQuery(cleanUrl);
    if (queryType === "doc") {
      path = doc(database, cleanUrl);
    } else {
      const queryConstraints = constraints.map((constr) => mapConstraint(constr));
      path = query(collection(database, cleanUrl), ...queryConstraints);
    }
    const unsub = _onSnapshot(
      path,
      (snapshot) => {
        const result = queryType === "doc" ? snapshot.data() || null : getOrderedResultFirestore(snapshot);
        const status = getStatus(result);
        const groupedResult = options?.groupByChangeType === true ? getGroupedResultFirestore(snapshot) : null;
        const extra = { ref: path, snapshot, unsubscribe: unsub, groupedResult };
        setCacheManually(request, { value: result, status }, extra);
        // onSuccess(result, status, extra, resolve);
      },
      (error) => {
        const extra = { ref: path, unsubscribe: unsub };
        setCacheManually(request, { value: error, status: "error" }, extra);
        // onError(error, "error", {}, resolve);
      },
    );
  };
