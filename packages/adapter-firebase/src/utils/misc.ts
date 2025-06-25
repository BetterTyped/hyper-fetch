import { FirestoreDocOrQuery } from "../firestore/firestore.types";

export const getStatus = (res: any) => {
  // Deliberate == instead of ===
  return (Array.isArray(res) && res.length === 0) || res == null ? "emptyResource" : "success";
};

export const isDocOrQuery = (fullUrl: string): FirestoreDocOrQuery => {
  const withoutSurroundingSlashes = fullUrl.replace(/^\/|\/$/g, "");
  const pathElements = withoutSurroundingSlashes.split("/").length;
  return pathElements % 2 === 0 ? FirestoreDocOrQuery.DOC : FirestoreDocOrQuery.QUERY;
};
