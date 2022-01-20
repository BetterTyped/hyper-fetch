import { encodeParams } from "client";
import { resetMocks, startServer, stopServer } from "../../utils/server";

describe("[Client] - Utils", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When stringify query params", () => {
    it("should encode falsy values", async () => {
      expect(encodeParams({ value: 0 })).toBe("?value=0");
      expect(encodeParams({ value: "" }, { skipEmptyString: false })).toBe("?value=");
      expect(encodeParams({ value: null }, { skipNull: false })).toBe("?value=null");
    });
  });
});
