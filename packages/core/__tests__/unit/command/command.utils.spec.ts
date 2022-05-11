import { stringifyKey } from "command";

describe("Command [ Utils ]", () => {
  describe("when stringifyKey function is used", () => {
    it("should stringifyKey valid values", async () => {
      const response = { something: 123 };
      const someString = "123";
      expect(stringifyKey(response)).toBe(JSON.stringify(response));
      expect(stringifyKey(someString)).toBe(someString);
      expect(stringifyKey(undefined)).toBe("");
      expect(stringifyKey(null)).toBe("");
    });

    it("should not stringifyKey invalid values", async () => {
      expect(stringifyKey(() => null)).toBe("");
    });
  });
});
