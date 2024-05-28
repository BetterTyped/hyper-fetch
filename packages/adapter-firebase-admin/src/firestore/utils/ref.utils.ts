import { CollectionReference, DocumentReference, Firestore } from "firebase-admin/lib/firestore";

export const getRef = (db: Firestore, fullUrl: string) => {
  const withoutSurroundingSlashes = fullUrl.replace(/^\/|\/$/g, "");
  const urlParts = withoutSurroundingSlashes.split("/").map((element, index) => {
    return index % 2 === 0 ? ["collection", element] : ["doc", element];
  });

  return urlParts.reduce((_db, value) => {
    const [method, pathPart] = value;
    if (method === "doc" && "doc" in _db) {
      return _db.doc(pathPart);
    }
    if (method === "collection" && "collection" in _db) {
      return _db.collection(pathPart);
    }
    return _db;
  }, db as unknown as Firestore | CollectionReference | DocumentReference) as CollectionReference | DocumentReference;
};
