export const getOrderedResultFirestore = (snapshot: any) => {
  const result = [];
  snapshot.docs.forEach((d) => {
    result.push(d.data());
  });
  return result.length > 0 ? result : null;
};
