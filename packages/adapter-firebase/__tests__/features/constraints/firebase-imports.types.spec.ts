import type { DataSnapshot } from "firebase/database";
import type { QuerySnapshot } from "firebase/firestore";
import { expectTypeOf } from "vitest";

import { getOrderedResultRealtime } from "../../../src/realtime/utils/result.utils";
import { getGroupedResultFirestore, getOrderedResultFirestore } from "../../../src/firestore/utils/result.utils";

/**
 * The adapter takes the snapshots of the `firebase` package its users install. Types from the internal `@firebase/*`
 * packages resolve to whatever version a workspace hoists, so another firebase version next to it broke them.
 */
describe("Firebase adapter [ Firebase types ]", () => {
  it("should read the snapshots of the firebase package", () => {
    expectTypeOf(getOrderedResultRealtime).parameter(0).toEqualTypeOf<DataSnapshot>();
    expectTypeOf(getOrderedResultFirestore).parameter(0).toEqualTypeOf<QuerySnapshot<any>>();
    expectTypeOf(getGroupedResultFirestore).parameter(0).toEqualTypeOf<QuerySnapshot>();
  });
});
