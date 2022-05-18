import { FetchBuilder } from "builder";
import { ClientQueryParamsType } from "client";
import { resetMocks, startServer, stopServer } from "../../utils/server";
import { testBuilder } from "../../utils/server/server.constants";

const getBuilder = () => {
  return new FetchBuilder({ baseUrl: "/some-url" });
};

let builder = getBuilder();

describe("[Methods] FetchCommand", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    builder = getBuilder();
    resetMocks();
  });

  afterAll(() => {
    stopServer();
    testBuilder.clear();
  });

  it("should change the 'cacheKey' when update the query params or params", async () => {
    const command = builder.createCommand<unknown, unknown, unknown, ClientQueryParamsType>()({
      endpoint: "/some-endpoint/:paramId",
    });
    const commandWithParams = command.setParams({ paramId: 1 });
    const commandWithQueryParams = commandWithParams.setQueryParams({ test: 1 });

    expect(command.cacheKey).not.toEqual(commandWithParams.cacheKey);
    expect(command.cacheKey).not.toEqual(commandWithQueryParams.cacheKey);
    expect(commandWithParams.cacheKey).not.toEqual(commandWithQueryParams.cacheKey);
  });

  it("should not change the 'cacheKey' once previously saved", async () => {
    const myCacheKey = "my-cache-key";

    const command = builder
      .createCommand<unknown, unknown, unknown, ClientQueryParamsType>()({
        endpoint: "/some-endpoint/:paramId",
      })
      .setCacheKey(myCacheKey);
    const commandWithParams = command.setParams({ paramId: 1 });
    const commandWithQueryParams = commandWithParams.setQueryParams({ test: 1 });

    expect(myCacheKey).toEqual(command.cacheKey);
    expect(myCacheKey).toEqual(commandWithParams.cacheKey);
    expect(myCacheKey).toEqual(commandWithQueryParams.cacheKey);
  });

  it("should change the 'used' to be true", async () => {
    const command = builder
      .createCommand<unknown, unknown, unknown, ClientQueryParamsType>()({
        endpoint: "/some-endpoint/:paramId",
      })
      .setUsed(true);
    const commandWithParams = command.setParams({ paramId: 1 });
    const commandWithQueryParams = commandWithParams.setQueryParams({ test: 1 });

    expect(true).toEqual(command.used);
    expect(true).toEqual(commandWithParams.used);
    expect(true).toEqual(commandWithQueryParams.used);
  });

  it("should change the 'data' using dataMapper", async () => {
    const multiplier = 2;

    const value1 = 2;
    const value2 = 3;

    const command = builder
      .createCommand<null, number>()({
        endpoint: "/some-endpoint/:paramId",
      })
      .setDataMapper((value) => value * multiplier);
    const commandWithData = command.setData(value1);
    const commandWithAnotherData = command.setData(value2);

    expect(commandWithData.data).toEqual(value1 * multiplier);
    expect(commandWithAnotherData.data).toEqual(value2 * multiplier);
  });
});
