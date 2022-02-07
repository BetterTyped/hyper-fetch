import { FetchBuilder } from "builder";
import { resetMocks, startServer, stopServer } from "../../utils/server";
import { getRefreshToken, interceptRefreshToken, getBase, interceptGetBase } from "../../utils/mocks";

const baseUrl = "some-url";
const getBuilder = () => {
  return new FetchBuilder({ baseUrl }).build();
};

let builder = getBuilder();

describe("[Auth] FetchBuilder", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
    localStorage.clear();
    builder.clear();
    builder = getBuilder();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When refreshing token", () => {
    it("should assign new token to the command and repeat request", async () => {
      interceptRefreshToken(200);
      interceptGetBase(401);

      const retry = jest.fn();

      const refreshRequest = getRefreshToken(builder).setData({ refreshToken: "custom token" });
      const baseRequest = getBase(builder);

      builder.onError(async (res, command) => {
        retry();
        const status = res[2];
        if (!command.used && status === 401) {
          const [data] = await refreshRequest.send();
          if (data) {
            interceptGetBase(200);
            return command.setUsed(true).send();
          }
        }
        return res;
      });
      const [data] = await baseRequest.send();

      expect(data).toEqual([]);
      expect(retry).toBeCalledTimes(1);
    });
    it("should try to repeat request only once", async () => {
      interceptRefreshToken(200);
      interceptGetBase(401);

      const retry = jest.fn();

      const refreshRequest = getRefreshToken(builder).setData({ refreshToken: "custom token" });
      const baseRequest = getBase(builder);

      builder.onError(async (res, command) => {
        const status = res[2];
        if (!command.used && status === 401) {
          retry();
          const [data] = await refreshRequest.send();
          if (data) {
            return command.setUsed(true).send();
          }
        }
        return res;
      });

      await baseRequest.send();

      expect(retry).toBeCalledTimes(1);
    });
  });
});
