import type { FirestoreQueryParams, RealtimeDBQueryParams } from "adapter";
import { $limit, $limitToFirst, $orderBy, $orderByChild, $startAfter, $where } from "constraints";
import { expectTypeOf } from "vitest";

describe("Query params [ Types ]", () => {
  it("should take Firestore constraints as an array", () => {
    expectTypeOf([
      $where("type", "==", "Green"),
      $orderBy("year"),
      $startAfter(2022),
      $limit(20),
    ]).toMatchTypeOf<FirestoreQueryParams>();
    // @ts-expect-error - constraints are passed as the array itself, not wrapped in an object
    expectTypeOf({ constraints: [$limit(1)] }).toMatchTypeOf<FirestoreQueryParams>();
  });

  it("should take Realtime Database constraints as an array", () => {
    expectTypeOf([
      $orderByChild("year"),
      $startAfter(2022, "0"),
      $limitToFirst(5),
    ]).toMatchTypeOf<RealtimeDBQueryParams>();
    // @ts-expect-error - $where is a Firestore constraint
    expectTypeOf([$where("type", "==", "Green")]).toMatchTypeOf<RealtimeDBQueryParams>();
  });
});
