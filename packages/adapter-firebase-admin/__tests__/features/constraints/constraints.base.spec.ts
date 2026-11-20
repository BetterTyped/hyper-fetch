import {
  $endAt,
  $endBefore,
  $equalTo,
  $limit,
  $limitToFirst,
  $limitToLast,
  $orderBy,
  $orderByChild,
  $orderByKey,
  $orderByValue,
  $startAfter,
  $startAt,
  $where,
} from "constraints";

describe("Constraints [ Base ]", () => {
  it("should prefix every constraint description with its own type", () => {
    const constraints = [
      $where("year", "==", 2023),
      $orderBy("year", "desc"),
      $limit(2),
      $startAt(2),
      $startAfter(2),
      $endAt(2),
      $endBefore(2),
      $orderByChild("year"),
      $orderByKey(),
      $orderByValue(),
      $limitToFirst(2),
      $limitToLast(2),
      $equalTo(2),
    ];

    constraints.forEach((constraint) => {
      expect(String(constraint).split("_")[0]).toBe(constraint.type);
    });
  });

  it("should describe equalTo and limitToLast with the same value differently", () => {
    expect(String($equalTo(2))).toBe("equalTo_2");
    expect(String($equalTo(2))).not.toBe(String($limitToLast(2)));
  });
});
