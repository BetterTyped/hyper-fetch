import { DataSnapshot } from "@firebase/database";

export const getOrderedResultRealtime = (snapshot: DataSnapshot) => {
  const res: any[] = [];
  snapshot.forEach((child) => {
    res.push({ ...child.val(), __key: child.key });
  });
  return res.length > 0 ? res : null;
};
