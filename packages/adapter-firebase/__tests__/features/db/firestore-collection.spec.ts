/**
 * @vitest-environment node
 */
import { Client } from "@hyper-fetch/core";
import { and, createDb, eq, gt } from "@hyper-fetch/db";
import type { DbErrorEvent } from "@hyper-fetch/db";
import { Socket } from "@hyper-fetch/sockets";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import waitForExpect from "wait-for-expect";
import { z } from "zod";

import { FirebaseAdapter, FirebaseSocketsAdapter } from "../../../src/adapter";
import { firestoreCollection } from "../../../src/db";
import { deleteCollectionForBrowser } from "../../utils/browser/clean.browser";
import { firestoreDbBrowser } from "../../utils/browser/initialize.firestore.browser";

const path = "db-posts";

const PostSchema = z.object({ id: z.string(), teamId: z.number(), title: z.string().min(1), likes: z.number() });

const seed = async () => {
  await deleteCollectionForBrowser(firestoreDbBrowser, path);
  await setDoc(doc(firestoreDbBrowser, path, "1"), { teamId: 1, title: "One", likes: 1 });
  await setDoc(doc(firestoreDbBrowser, path, "2"), { teamId: 1, title: "Two", likes: 2 });
  await setDoc(doc(firestoreDbBrowser, path, "9"), { teamId: 2, title: "Nine", likes: 9 });
};

const setup = () => {
  const client = new Client({ url: "" }).setAdapter(FirebaseAdapter(firestoreDbBrowser));
  const socket = new Socket({ url: "", adapter: FirebaseSocketsAdapter(firestoreDbBrowser) });
  const Post = firestoreCollection(PostSchema, { client, socket, path, key: "id" });
  const db = createDb({ post: Post });
  const errors: DbErrorEvent[] = [];
  db.onError((event) => errors.push(event));
  return { db, errors };
};

const ids = (state: { data?: { id: string }[] }) => state.data?.map((post) => post.id);

describe("Firestore [ @hyper-fetch/db collection ]", () => {
  let context = setup();

  beforeEach(async () => {
    await seed();
    context = setup();
  });

  afterEach(() => {
    context.db.destroy();
  });

  it("sends conditions and orders as Firestore constraints and stays live", async () => {
    const { db } = context;
    const query = db.post
      .where((post) => and(eq(post.teamId, 1), gt(post.likes, 0)))
      .orderBy((post) => post.likes, "desc");
    expect(query.explain()).toMatchObject({ kind: "list", loader: 0, local: [] });
    const unsubscribe = query.subscribe(() => {});
    await waitForExpect(() => expect(query.getSnapshot().status).toBe("ready"));
    expect(ids(query.getSnapshot())).toStrictEqual(["2", "1"]);
    await waitForExpect(() => expect(query.getSnapshot().stale).toBe(false));

    await setDoc(doc(firestoreDbBrowser, path, "3"), { teamId: 1, title: "Three", likes: 3 });
    await waitForExpect(() => expect(ids(query.getSnapshot())).toStrictEqual(["3", "2", "1"]));

    await updateDoc(doc(firestoreDbBrowser, path, "1"), { title: "Renamed" });
    await waitForExpect(() => expect(query.getSnapshot().data?.[2].title).toBe("Renamed"));

    await updateDoc(doc(firestoreDbBrowser, path, "2"), { teamId: 2 });
    await waitForExpect(() => expect(ids(query.getSnapshot())).toStrictEqual(["3", "1"]));

    await deleteDoc(doc(firestoreDbBrowser, path, "1"));
    await waitForExpect(() => expect(ids(query.getSnapshot())).toStrictEqual(["3"]));
    unsubscribe();
  });

  it("writes through Firestore and shows the change from its snapshot", async () => {
    const { db } = context;
    const query = db.post.where((post) => eq(post.teamId, 1));
    const unsubscribe = query.subscribe(() => {});
    await waitForExpect(() => expect(query.getSnapshot().status).toBe("ready"));

    expect(await db.post.insert({ id: "5", teamId: 1, title: "Five", likes: 5 })).toMatchObject({ success: true });
    await waitForExpect(() => expect(ids(query.getSnapshot())).toContain("5"));
    expect((await getDoc(doc(firestoreDbBrowser, path, "5"))).data()).toStrictEqual({
      teamId: 1,
      title: "Five",
      likes: 5,
    });

    expect(await db.post.update("5", { title: "Five again" })).toMatchObject({ success: true });
    await waitForExpect(() =>
      expect(query.getSnapshot().data?.find((post) => post.id === "5")?.title).toBe("Five again"),
    );

    expect(await db.post.delete("5")).toMatchObject({ success: true });
    await waitForExpect(() => expect(ids(query.getSnapshot())).not.toContain("5"));
    unsubscribe();
  });

  it("reads documents by key and an empty query", async () => {
    const { db } = context;
    const one = db.post.findOne("9");
    const missing = db.post.findOne("404");
    const empty = db.post.where((post) => eq(post.teamId, 7));
    const unsubscribes = [one.subscribe(() => {}), missing.subscribe(() => {}), empty.subscribe(() => {})];
    await waitForExpect(() =>
      expect(one.getSnapshot().data).toStrictEqual({ id: "9", teamId: 2, title: "Nine", likes: 9 }),
    );
    await waitForExpect(() => expect(missing.getSnapshot()).toMatchObject({ status: "ready", data: undefined }));
    await waitForExpect(() => expect(empty.getSnapshot()).toMatchObject({ status: "ready", data: [] }));
    expect(one.explain().syncs).toStrictEqual([{ type: "changes", topic: `${path}/9` }]);

    await updateDoc(doc(firestoreDbBrowser, path, "9"), { title: "Nine live" });
    await waitForExpect(() => expect(one.getSnapshot().data?.title).toBe("Nine live"));
    await deleteDoc(doc(firestoreDbBrowser, path, "9"));
    await waitForExpect(() => expect(one.getSnapshot().data).toBeUndefined());
    unsubscribes.forEach((unsubscribe) => unsubscribe());
  });

  it("validates documents from Firestore against the schema", async () => {
    const { db, errors } = context;
    await setDoc(doc(firestoreDbBrowser, path, "6"), { teamId: 1, title: "", likes: 6 });
    const query = db.post.where((post) => eq(post.teamId, 1));
    const unsubscribe = query.subscribe(() => {});
    await waitForExpect(() => expect(query.getSnapshot().status).toBe("ready"));
    expect(ids(query.getSnapshot())).not.toContain("6");
    expect(errors.some((event) => event.type === "validation")).toBe(true);
    unsubscribe();
  });
});
