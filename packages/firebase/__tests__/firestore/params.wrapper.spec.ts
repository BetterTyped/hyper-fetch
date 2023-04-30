import { where, orderBy, limit, startAfter, startAt, endAt, endBefore } from "@firebase/firestore";

import { params } from "../../src/adapter/utils/params.wrapper";

describe("Firestore [params wrapper]", () => {
  it("should return appropriate string representation for each type of firestore query constraint", () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const [_where, _orderBy, _limit, _startAfter, _startAt, _endAt, _endBefore] = params([
      where("type", "==", "Green"),
      orderBy("type", "desc"),
      limit(124),
      startAfter(["Field1", "Field2"]),
      startAt(["Field1", "Field2"]),
      endAt(["Field1", "Field2"]),
      endBefore(["Field1", "Field2"]),
    ]);

    expect(String(_where)).toEqual(`where_==_Green`);
    expect(String(_orderBy)).toEqual(`orderBy_type_desc`);
    expect(String(_limit)).toEqual(`limit_124_F`);
    expect(String(_startAfter)).toEqual(`startAfter_Field1,Field2`);
    expect(String(_startAt)).toEqual(`startAt_Field1,Field2`);
    expect(String(_endAt)).toEqual(`endAt_Field1,Field2`);
    expect(String(_endBefore)).toEqual(`endBefore_Field1,Field2`);
  });
});
