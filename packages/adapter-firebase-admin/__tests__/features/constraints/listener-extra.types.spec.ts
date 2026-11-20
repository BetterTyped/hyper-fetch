import type {
  FirestoreAdminOnSnapshotExtra,
  FirestoreStatuses,
  RealtimeAdminOnValueMethodExtra,
  RealtimeDBStatuses,
} from "adapter";
import { expectTypeOf } from "vitest";

describe("Listener extra [ Types ]", () => {
  it("should type the status every snapshot carries", () => {
    expectTypeOf<FirestoreAdminOnSnapshotExtra["status"]>().toEqualTypeOf<FirestoreStatuses>();
    expectTypeOf<RealtimeAdminOnValueMethodExtra["status"]>().toEqualTypeOf<RealtimeDBStatuses>();
  });
});
