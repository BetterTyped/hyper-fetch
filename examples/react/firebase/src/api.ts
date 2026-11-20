import { createClient } from "@hyper-fetch/core";
import { $limit, $orderBy, FirebaseAdapter, type FirestoreQueryParams } from "@hyper-fetch/firebase";

import { firestore } from "./firebase";

/** The database instance decides the methods: Firestore gives `getDocs`, `addDoc`, `updateDoc`, `deleteDoc`... */
export const client = createClient({ url: "" }).setAdapter(FirebaseAdapter(firestore));

export type Message = {
  author: string;
  text: string;
  likes: number;
  createdAt: number;
};
/** The adapter adds the document id as `__key`. */
export type MessageDoc = Message & { __key: string };

// The endpoint is the Firestore path. One segment is a collection, two are a document.
const getMessages = client.createRequest<{
  response: MessageDoc[];
  queryParams?: FirestoreQueryParams;
}>()({
  endpoint: "messages",
  method: "getDocs",
});

/** Constraints are data in `queryParams`, so they are a part of the cache key. */
export const latestMessages = getMessages.setQueryParams([$orderBy("createdAt", "desc"), $limit(10)]);

export const addMessage = client.createRequest<{
  response: MessageDoc;
  payload: Message;
}>()({
  endpoint: "messages",
  method: "addDoc",
});

export const likeMessage = client.createRequest<{
  response: Pick<Message, "likes">;
  payload: Pick<Message, "likes">;
}>()({
  endpoint: "messages/:messageId",
  method: "updateDoc",
});

export const deleteMessage = client.createRequest<{ response: null }>()({
  endpoint: "messages/:messageId",
  method: "deleteDoc",
});
