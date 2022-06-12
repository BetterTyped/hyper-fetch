import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { testErrorState, testSuccessState } from "../../shared";
import { builder, createCommand, renderUseFetch, waitForRender } from "../../utils";

describe("useFetch [ Deduplication ]", () => {
  let dedupeCommand = createCommand({ deduplicate: true, deduplicateTime: 20, retry: 5, retryTime: 200 });

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    dedupeCommand = createCommand({ deduplicate: true, deduplicateTime: 20, retry: 5, retryTime: 200 });
    jest.resetModules();
    builder.clear();
  });

  describe("given command deduplicate attribute is active", () => {
    describe("when initializing two hooks with the same command", () => {
      it("should send only one request", async () => {
        createRequestInterceptor(dedupeCommand);
        renderUseFetch(dedupeCommand);
        renderUseFetch(dedupeCommand);

        await waitForRender();

        expect(builder.fetchDispatcher.getQueueRequestCount(dedupeCommand.queueKey)).toBe(1);
      });
      it("should deduplicate requests within deduplication time", async () => {
        createRequestInterceptor(dedupeCommand, { delay: 200 });

        renderUseFetch(dedupeCommand);
        await waitForRender(10);

        renderUseFetch(dedupeCommand);
        await waitForRender();

        expect(builder.fetchDispatcher.getQueueRequestCount(dedupeCommand.queueKey)).toBe(1);
      });
    });
    describe("when response is failed", () => {
      it("should perform one retry on failure", async () => {
        const errorMock = createRequestInterceptor(dedupeCommand, { status: 400 });
        const responseOne = renderUseFetch(dedupeCommand);
        const responseTwo = renderUseFetch(dedupeCommand);

        await waitForRender();
        await testErrorState(errorMock, responseOne);
        await testErrorState(errorMock, responseTwo);

        const successMock = createRequestInterceptor(dedupeCommand);
        await testSuccessState(successMock, responseOne);
        await testSuccessState(successMock, responseTwo);

        expect(builder.fetchDispatcher.getQueueRequestCount(dedupeCommand.queueKey)).toBe(2);
      });
    });
    describe("when response is successful", () => {
      it("should share the success data with all hooks", async () => {
        const mock = createRequestInterceptor(dedupeCommand);
        const responseOne = renderUseFetch(dedupeCommand);
        const responseTwo = renderUseFetch(dedupeCommand);

        await waitForRender();
        await testSuccessState(mock, responseOne);
        await testSuccessState(mock, responseTwo);
      });
    });
  });
});
