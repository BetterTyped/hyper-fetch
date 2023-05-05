export const getOrderedResultRealtime = (snapshot: any) => {
  const res = [];
  snapshot.forEach((child) => {
    res.push(child.val());
  });
  return res.length > 0 ? res : null;
};
