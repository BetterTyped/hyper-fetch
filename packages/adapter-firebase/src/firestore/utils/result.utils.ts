import type { QuerySnapshot, DocumentData } from "firebase/firestore";

export const getOrderedResultFirestore = (snapshot: QuerySnapshot<any>) => {
  const result: (DocumentData & { __key: string })[] = [];
  snapshot.docs.forEach((d) => {
    result.push({ ...d.data(), __key: d.id });
  });
  return result;
};

export const getGroupedResultFirestore = (snapshot: QuerySnapshot) => {
  const groupedResult: Record<"added" | "modified" | "removed", (DocumentData & { __key: string })[]> = {
    added: [],
    modified: [],
    removed: [],
  };
  snapshot.docChanges().forEach((change) => {
    groupedResult[change.type].push({ ...change.doc.data(), __key: change.doc.id });
  });
  return [...groupedResult.added, ...groupedResult.modified, ...groupedResult.removed].length > 0
    ? groupedResult
    : null;
};
