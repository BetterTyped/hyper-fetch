import type {
  FirestoreOnSnapshotExtra,
  FirestoreStatuses,
  RealtimeDbOnValueMethodExtra,
  RealtimeDBStatuses,
} from "adapter";
import { expectTypeOf } from "vitest";

describe("Listener extra [ Types ]", () => {
  it("should type the status every snapshot carries", () => {
    expectTypeOf<FirestoreOnSnapshotExtra["status"]>().toEqualTypeOf<FirestoreStatuses>();
    expectTypeOf<RealtimeDbOnValueMethodExtra["status"]>().toEqualTypeOf<RealtimeDBStatuses>();
  });
});
