import { QuerySnapshot, DocumentData } from "firebase-admin/firestore";

export const getOrderedResultFirestore = (snapshot: QuerySnapshot) => {
  const result: (DocumentData & { __key: string })[] = [];
  snapshot.docs.forEach((d) => {
    result.push({ ...d.data(), __key: d.id });
  });
  return result;
};

export const getGroupedResultFirestore = (snapshot: QuerySnapshot) => {
  const groupedResult: { added: DocumentData[]; modified: DocumentData[]; removed: DocumentData[] } = {
    added: [],
    modified: [],
    removed: [],
  };
  snapshot.docChanges().forEach((change) => {
    groupedResult[change.type].push(change.doc.data());
  });
  return [...groupedResult.added, ...groupedResult.modified, ...groupedResult.removed].length > 0
    ? groupedResult
    : null;
};
