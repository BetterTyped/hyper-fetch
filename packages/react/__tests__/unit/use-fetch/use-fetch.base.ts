import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { createCommand, renderUseFetch, createCacheData, sleep } from "../../utils";
import { testSuccessState, testErrorState, testInitialState, testCacheState } from "../../shared";

describe("useFetch [ Basic ]", () => {
  let command = createCommand();

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(async () => {
    jest.resetModules();
    command = createCommand();
  });

  describe("when hook is initialized", () => {
    it("should initialize in idle state", async () => {
      createRequestInterceptor(command);
      const response = await renderUseFetch(command);

      await testInitialState(response);
    });
    it("should load cached data", async () => {
      const cache = createCacheData(command);
      createRequestInterceptor(command);
      const response = await renderUseFetch(command);

      await testCacheState(cache, response);
    });
    it("should not load stale cache data", async () => {
      createRequestInterceptor(command, { delay: 20 });
      const response = await renderUseFetch(command);

      await sleep(10);
      await testCacheState([null, null, null], response);
    });
  });
  describe("when hook get success response", () => {
    it("should set state with success data", async () => {
      const mock = createRequestInterceptor(command);
      const response = await renderUseFetch(command);

      await testSuccessState(mock, response);
    });
    it("should clear previous error state once success response is returned", async () => {
      const errorMock = createRequestInterceptor(command, { status: 400 });
      const response = await renderUseFetch(command);

      await testErrorState(errorMock, response);

      const mock = createRequestInterceptor(command);
      response.result.current.revalidate();

      await testSuccessState(mock, response);
    });
  });
  describe("when hook get error response", () => {
    it("should set state with error data", async () => {
      const mock = createRequestInterceptor(command, { status: 400 });
      const response = await renderUseFetch(command);

      await testErrorState(mock, response);
    });
    it("should keep previous success state once error response is returned", async () => {
      const mock = createRequestInterceptor(command);
      const response = await renderUseFetch(command);

      await testSuccessState(mock, response);
      const errorMock = createRequestInterceptor(command, { status: 400 });

      response.result.current.revalidate();

      await testErrorState(errorMock, response, mock);
    });
  });

  describe("when command is about to change", () => {
    it("should use the latest command to fetch data", async () => {});
    it("should use the latest command when key changed", async () => {});
  });
});
