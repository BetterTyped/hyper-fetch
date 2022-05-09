import { stringifyQueryParams } from "builder";
import { resetInterceptors, startServer, stopServer } from "../../server";
import { createBuilder, createCommand } from "../../utils";

describe("FetchBuilder [ Mappers ]", () => {
  let builder = createBuilder();
  let command = createCommand(builder);

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    builder = createBuilder();
    command = createCommand(builder);
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using stringifyQueryParams", () => {
    it("should encode falsy values", async () => {
      expect(stringifyQueryParams({ value: 0 })).toBe("?value=0");
      expect(stringifyQueryParams({ value: "" }, { skipEmptyString: false })).toBe("?value=");
      expect(stringifyQueryParams({ value: null }, { skipNull: false })).toBe("?value=null");
      expect(stringifyQueryParams({ value: "" }, { skipEmptyString: true })).toBe("");
      expect(stringifyQueryParams({ value: null }, { skipNull: true })).toBe("");
    });
    it("should encode truthy values", async () => {
      expect(stringifyQueryParams({ value: 10 })).toBe("?value=10");
      expect(stringifyQueryParams({ value: "test" })).toBe("?value=test");
      expect(stringifyQueryParams({ value: [1, 2, 3] })).toBe("?value[]=1&value[]=2&value[]=3");
      expect(stringifyQueryParams({ value: { data: "test" } })).toBe("?value=%5Bobject%20Object%5D");
    });
    it("should encode not allowed characters values", async () => {
      expect(stringifyQueryParams({ value: "[]" })).toBe("?value=%5B%5D");
      expect(stringifyQueryParams({ value: "/" })).toBe("?value=%2F");
      expect(stringifyQueryParams({ value: "," })).toBe("?value=%2C");
      expect(stringifyQueryParams({ value: "|" })).toBe("?value=%7C");
      expect(stringifyQueryParams({ value: ":" })).toBe("?value=%3A");
      expect(stringifyQueryParams({ value: ";" })).toBe("?value=%3B");
      expect(stringifyQueryParams({ value: "+" })).toBe("?value=%2B");
      expect(stringifyQueryParams({ value: "(" })).toBe("?value=%28");
      expect(stringifyQueryParams({ value: ")" })).toBe("?value=%29");
      expect(stringifyQueryParams({ value: "*" })).toBe("?value=%2A");
      expect(stringifyQueryParams({ value: "&" })).toBe("?value=%26");
      expect(stringifyQueryParams({ value: "^" })).toBe("?value=%5E");
      expect(stringifyQueryParams({ value: "%" })).toBe("?value=%25");
      expect(stringifyQueryParams({ value: "$" })).toBe("?value=%24");
      expect(stringifyQueryParams({ value: "#" })).toBe("?value=%23");
      expect(stringifyQueryParams({ value: "@" })).toBe("?value=%40");
      expect(stringifyQueryParams({ value: "!" })).toBe("?value=%21");
    });
    it("should encode array values with different formats", async () => {
      expect(stringifyQueryParams({ value: [1, 2, 3] }, { arrayFormat: "bracket" })).toBe(
        "?value[]=1&value[]=2&value[]=3",
      );
      expect(stringifyQueryParams({ value: [1, 2, 3] }, { arrayFormat: "bracket-separator" })).toBe("?value[]=1|2|3");
      expect(stringifyQueryParams({ value: [1, 2, 3] }, { arrayFormat: "comma" })).toBe("?value=1,2,3");
      expect(stringifyQueryParams({ value: [1, 2, 3] }, { arrayFormat: "index" })).toBe(
        "?value[0]=1&value[1]=2&value[2]=3",
      );
      expect(stringifyQueryParams({ value: [1, 2, 3] }, { arrayFormat: "none" })).toBe("?value=1&value=2&value=3");
      expect(stringifyQueryParams({ value: [1, 2, 3] }, { arrayFormat: "separator" })).toBe("?value=1|2|3");
      expect(stringifyQueryParams({ value: [1, 2, 3] }, { arrayFormat: "separator", arraySeparator: "#" })).toBe(
        "?value=1#2#3",
      );
    });
  });

  describe("When using headerMapper", () => {
    it("should assign default headers with headers mapper", async () => {
      const defaultHeaders = { "Content-Type": "application/json" };
      const headers = builder.headerMapper(command);

      expect(headers).toEqual(defaultHeaders);
    });
    it("should assign form data headers", async () => {
      const defaultHeaders = {};
      const data = new FormData();
      const formDataCommand = command.setData(data);
      const headers = builder.headerMapper(formDataCommand);

      expect(headers).toEqual(defaultHeaders);
    });
    it("should not re-assign form data headers", async () => {
      const defaultHeaders = { "Content-Type": "some-custom-format" };
      const formDataCommand = command.setHeaders(defaultHeaders);
      const headers = builder.headerMapper(formDataCommand);

      expect(headers).toEqual(defaultHeaders);
    });
  });

  describe("When using payloadMapper", () => {
    it("should allow to stringify payload", async () => {
      const data = { data: [] };
      const payload = builder.payloadMapper(data);

      expect(payload).toEqual(JSON.stringify(data));
    });
    it("should not stringify FormData payload", async () => {
      const data = new FormData();
      const payload = builder.payloadMapper(data);

      expect(payload).toEqual(data);
    });
    it("should stringify null payload", async () => {
      const data = null;
      const payload = builder.payloadMapper(data);

      expect(payload).toEqual(JSON.stringify(data));
    });
    it("should not stringify undefined payload", async () => {
      const payload = builder.payloadMapper(undefined);

      expect(payload).toBeUndefined();
    });
  });
});
