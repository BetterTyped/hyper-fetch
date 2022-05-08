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

  describe("When using mapper methods", () => {
    it("should allow to stringify query params with query params mapper", async () => {
      const queryParams = { query: 1 };
      const stringified = builder.stringifyQueryParams(queryParams);

      expect(stringified).toEqual("?query=1");
    });
    it("should assign default headers with headers mapper", async () => {
      const defaultHeaders = { "Content-Type": "application/json" };
      const headers = builder.headerMapper(command);

      expect(headers).toEqual(defaultHeaders);
    });
    it("should stringify data with payload mapper", async () => {
      const data = { data: [] };
      const payload = builder.payloadMapper(data);

      expect(payload).toEqual(JSON.stringify(data));
    });
  });
});
