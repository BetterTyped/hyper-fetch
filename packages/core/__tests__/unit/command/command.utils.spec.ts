import { getCommandDispatcher, getCommandKey, getProgressData, stringifyKey } from "command";
import { createBuilder, createCommand } from "../../utils";

describe("Command [ Utils ]", () => {
  describe("when stringifyKey function is used", () => {
    it("should stringify valid values", async () => {
      const response = { something: 123 };
      const someString = "123";
      expect(stringifyKey(response)).toBe(JSON.stringify(response));
      expect(stringifyKey(someString)).toBe(someString);
      expect(stringifyKey(undefined)).toBe("");
      expect(stringifyKey(null)).toBe("");
    });

    it("should not stringify invalid values", async () => {
      expect(stringifyKey(() => null)).toBe("");
    });
  });
  describe("when getProgressData function is used", () => {
    it("should process valid values on NaN progress values", async () => {
      const date = new Date();
      const response = getProgressData(date, date, { total: NaN, loaded: NaN });
      expect(response).toStrictEqual({
        progress: 0,
        timeLeft: 0,
        sizeLeft: 0,
        total: 0,
        loaded: 0,
        startTimestamp: +date,
      });
    });
  });
  describe("when getCommandKey function is used", () => {
    it("should return exact endpoint key", async () => {
      const builder = createBuilder();
      const command = createCommand(builder, { endpoint: "/users/:userId" })
        .setParams({ userId: 1 } as null)
        .setQueryParams("?test=1");
      expect(getCommandKey(command)).toBe("GET_/users/1?test=1");
    });
    it("should useInitialValues and return generic endpoint key", async () => {
      const builder = createBuilder();
      const command = createCommand(builder, { endpoint: "/users/:userId" })
        .setParams({ userId: 1 } as null)
        .setQueryParams("?test=1");
      expect(getCommandKey(command, true)).toBe("GET_/users/:userId");
    });
  });
  describe("when getCommandDispatcher function is used", () => {
    it("should give proper auto dispatcher", async () => {
      const builder = createBuilder();
      const fetchCommand = createCommand(builder);
      const submitCommand = createCommand(builder, { method: "POST" });

      const valueFetch = getCommandDispatcher(fetchCommand, "auto");
      const valueSubmit = getCommandDispatcher(submitCommand, "auto");
      expect(valueFetch[0]).toBe(builder.fetchDispatcher);
      expect(valueSubmit[0]).toBe(builder.submitDispatcher);
      expect(valueFetch[1]).toBe(true);
      expect(valueSubmit[1]).toBe(false);
    });
    it("should give selected dispatcher", async () => {
      const builder = createBuilder();
      const fetchCommand = createCommand(builder);
      const submitCommand = createCommand(builder, { method: "POST" });

      const valueFetch = getCommandDispatcher(fetchCommand, "submit");
      const valueSubmit = getCommandDispatcher(submitCommand, "fetch");
      expect(valueSubmit[0]).toBe(builder.fetchDispatcher);
      expect(valueFetch[0]).toBe(builder.submitDispatcher);
      expect(valueSubmit[1]).toBe(true);
      expect(valueFetch[1]).toBe(false);
    });
  });
});
