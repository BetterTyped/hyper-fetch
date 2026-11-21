import type { FirestoreQueryParams, RealtimeDBQueryParams } from "adapter";
import { $limit, $orderByChild, $startAfter, $where, createFirestoreConstraints, createRealtimeConstraints } from "constraints";
import { expectTypeOf } from "vitest";

type Tea = {
  __key: string;
  name: string;
  type: "Green" | "Black";
  year: number;
  tags: string[];
  origin: { country: string };
};

type Message = { text: string; sentAt: number; author: { name: string } };

describe("Query params [ Types ]", () => {
  it("should accept a callback, the constraints array and the deprecated object", () => {
    const callback: FirestoreQueryParams<Tea> = (c) => c.where("type", "==", "Green").orderBy("year", "desc").limit(20);
    const array: FirestoreQueryParams<Tea> = [$where("type", "==", "Green"), $limit(1)];
    const deprecated: FirestoreQueryParams<Tea> = { constraints: [$limit(1)] };
    const realtime: RealtimeDBQueryParams<Message> = (c) => c.orderByChild("sentAt").limitToLast(50);

    expectTypeOf([callback, array, deprecated, realtime]).toBeArray();
    // @ts-expect-error - $where is a Firestore constraint
    expectTypeOf([$where("type", "==", "Green")]).toMatchTypeOf<RealtimeDBQueryParams>();
    expectTypeOf([$orderByChild("year"), $startAfter(2022, "0")]).toMatchTypeOf<RealtimeDBQueryParams>();
  });

  it("should check Firestore fields and values against the document", () => {
    const c = createFirestoreConstraints<Tea>();

    c.where("origin.country", "==", "China");
    c.where("type", "in", ["Green", "Black"]);
    c.where("tags", "array-contains", "organic");
    c.where("tags", "array-contains-any", ["organic", "loose"]);
    // @ts-expect-error - unknown field
    c.where("yaer", "==", 2020);
    // @ts-expect-error - year is a number
    c.where("year", "==", "2020");
    // @ts-expect-error - "in" takes an array
    c.where("type", "in", "Green");
    // @ts-expect-error - "array-contains" takes one element
    c.where("tags", "array-contains", ["organic"]);
    // @ts-expect-error - __key is the document id, not a field
    c.where("__key", "==", "1");
    // @ts-expect-error - unknown field
    c.orderBy("price");
  });

  it("should take one Firestore cursor value per orderBy, in order", () => {
    const ordered = createFirestoreConstraints<Tea>().orderBy("year").orderBy("name");

    ordered.startAfter(2023, "Sencha");
    ordered.startAt(2023);
    ordered.endBefore(2023, "Sencha");
    // @ts-expect-error - name is a string
    ordered.startAfter(2023, 1);
    // @ts-expect-error - two orderBy, three values
    ordered.startAfter(2023, "Sencha", "Gyokuro");
    createFirestoreConstraints<Tea>().startAfter("document-id");
  });

  it("should allow one Realtime Database orderBy and type cursors by the ordered value", () => {
    const c = createRealtimeConstraints<Message>();

    c.orderByChild("author/name").equalTo("ann");
    c.orderByChild("sentAt").startAfter(10, "key").limitToLast(5);
    c.limitToFirst(5).orderByKey().startAt("a");
    // @ts-expect-error - one orderBy per query
    c.orderByChild("sentAt").orderByKey();
    // @ts-expect-error - cursors need an orderBy first
    c.startAt(1);
    // @ts-expect-error - sentAt is a number
    c.orderByChild("sentAt").equalTo("x");
    // @ts-expect-error - Realtime Database child paths use "/"
    c.orderByChild("author.name");
  });

  it("should keep untyped constraints open", () => {
    createFirestoreConstraints().where("anything", "==", 1).orderBy("other").startAfter(1);
    createRealtimeConstraints().orderByChild("any/path").equalTo(true);
  });
});
