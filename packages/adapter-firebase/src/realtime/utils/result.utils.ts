export const getOrderedResultRealtime = (snapshot: any) => {
  const res = [];
  snapshot.forEach((child) => {
    res.push({ ...child.val(), __key: child.key });
  });
  return res.length > 0 ? res : null;
};
