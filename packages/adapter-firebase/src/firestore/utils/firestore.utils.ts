export const getOrderedResultFirestore = (snapshot: any) => {
  const result = [];
  snapshot.docs.forEach((d) => {
    result.push(d.data());
  });
  return result.length > 0 ? result : null;
};

export const getGroupedResultFirestore = (snapshot: any) => {
  const groupedResult = { added: [], modified: [], removed: [] };
  snapshot.docChanges().forEach((change) => {
    groupedResult[change.type].push(change.doc.data());
  });
  return [...groupedResult.added, ...groupedResult.modified, ...groupedResult.removed].length > 0
    ? groupedResult
    : null;
};
