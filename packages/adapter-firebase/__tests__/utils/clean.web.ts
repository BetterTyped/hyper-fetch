import { collection, getDocs, deleteDoc, Firestore } from "firebase/firestore";
// https://github.com/firebase/snippets-node/blob/e5f6214059bdbc63f94ba6600f7f84e96325548d/firestore/main/index.js#L889-L921

export async function deleteCollectionForWeb(firestoreDb: Firestore, path: string) {
  const ref = collection(firestoreDb, path);
  const docsToDelete = await getDocs(ref);
  const refs = [];
  const docRefs = new Promise((resolve) => {
    docsToDelete.docs.forEach((doc) => {
      refs.push(deleteDoc(doc.ref));
    });
    resolve(true);
  });

  await docRefs;
  await Promise.all(refs);
}
