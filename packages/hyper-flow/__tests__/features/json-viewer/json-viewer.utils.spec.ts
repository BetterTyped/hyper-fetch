import { getRaw, toDataKeys, updateValue } from "@/components/json-viewer/json-viewer.utils";

describe("JSON viewer [ Paths ]", () => {
  const createData = () => ({
    user: { name: "Maciej", address: { city: "Kraków" } },
    tags: ["a", "b"],
  });

  describe("toDataKeys", () => {
    // react-json-tree passes key paths from the leaf up
    it("should read paths of a tree with a hidden root", () => {
      expect(toDataKeys(["city", "address", "user"], true)).toStrictEqual(["user", "address", "city"]);
    });

    it("should drop the root label of a tree with a visible root", () => {
      expect(toDataKeys(["city", "address", "user", "root"], false)).toStrictEqual(["user", "address", "city"]);
    });

    it("should keep data keys named root", () => {
      expect(toDataKeys(["trap", "root"], true)).toStrictEqual(["root", "trap"]);
    });
  });

  describe("updateValue", () => {
    it("should update a top level value", () => {
      const data = createData();
      updateValue(data, ["tags"], ["c"]);
      expect(data.tags).toStrictEqual(["c"]);
    });

    it("should update a nested value", () => {
      const data = createData();
      updateValue(data, ["user", "address", "city"], "Warsaw");
      expect(data.user.address.city).toBe("Warsaw");
      expect(data.user.name).toBe("Maciej");
    });

    it("should update array items", () => {
      const data = createData();
      updateValue(data, ["tags", 1], "z");
      expect(data.tags).toStrictEqual(["a", "z"]);
    });

    it("should not write to another object when a key in the path is missing", () => {
      const data = createData();
      updateValue(data, ["user", "missing", "city"], "Nowhere");
      expect(data).toStrictEqual(createData());
    });

    it("should not add keys that don't exist", () => {
      const data = createData();
      updateValue(data, ["user", "email"], "a@b.c");
      expect(data.user).not.toHaveProperty("email");
    });

    it("should handle data that has its own root key", () => {
      const data = { root: { trap: true }, trap: true };
      updateValue(data, toDataKeys(["trap", "root"], true), false);
      expect(data.root.trap).toBeFalse();
      expect(data.trap).toBeTrue();
    });
  });

  describe("getRaw", () => {
    it("should read a nested value", () => {
      expect(getRaw(createData(), ["user", "address", "city"])).toBe("Kraków");
    });

    it("should read a nested object", () => {
      expect(getRaw(createData(), ["user", "address"])).toStrictEqual({ city: "Kraków" });
    });

    it("should read array items", () => {
      expect(getRaw(createData(), ["tags", 0])).toBe("a");
    });

    it("should not return a parent when a key is missing", () => {
      expect(getRaw(createData(), ["user", "missing", "city"])).toBeUndefined();
    });
  });
});
