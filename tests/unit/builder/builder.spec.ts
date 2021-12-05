import { ClientQueryParamsType, ClientType, FetchClientXHR } from "client";
import { FetchBuilder, FetchMiddleware } from "middleware";
import { interceptBase } from "../../utils/mocks";
import { resetMocks, startServer, stopServer } from "../../utils/server";

const baseUrl = "some-url";
const options: FetchClientXHR = { timeout: 1000 };

describe("FetchBuilder", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When initializing the builder", () => {
    it("should assign provided props", async () => {
      const builder = new FetchBuilder({ baseUrl, debug: true, options });

      expect(builder.options).toStrictEqual(options);
      expect(builder.baseUrl).toBe(baseUrl);
      expect(builder.debug).toBe(true);
    });

    it("should initialize with applied methods", async () => {
      const builder = new FetchBuilder({ baseUrl, options })
        .onError((error) => error)
        .onRequest((middleware) => middleware)
        .onRequest((middleware) => middleware)
        .onResponse(() => [null, null, 0])
        .onResponse(() => [null, null, 0]);

      expect(builder.onRequestCallbacks).toHaveLength(2);
      expect(builder.onResponseCallbacks).toHaveLength(2);
      expect(builder.onErrorCallback).toBeDefined();
    });
  });

  describe("When using built in methods", () => {
    it("should apply custom client", async () => {
      const customHttpClient: ClientType<any, any, ClientQueryParamsType> = () => Promise.resolve([null, null, 0]);

      const builder = new FetchBuilder({ baseUrl, options }).setClient(customHttpClient);

      expect(builder.client).toBe(customHttpClient);
    });

    it("should call the methods", async () => {
      const errorCall = jest.fn();
      const requestCall = jest.fn();
      const responseCall = jest.fn();

      const builder = new FetchBuilder({ baseUrl })
        .onError((error) => {
          errorCall(error);
          return error;
        })
        .onRequest((middleware) => {
          requestCall(middleware);
          return middleware;
        })
        .onResponse((response, middleware) => {
          responseCall(response, middleware);
          return [null, null, 0];
        })
        .build();

      const middleware = builder()({
        endpoint: "/",
      });

      interceptBase(400);

      await middleware.send();

      expect(errorCall.mock.calls[0][0]).toEqual({ message: "Error" });
      expect(requestCall.mock.calls[0][0] instanceof FetchMiddleware).toBeTruthy();
      expect(responseCall.mock.calls[0][0]).toEqual([null, { message: "Error" }, 400]);
      expect(responseCall.mock.calls[0][1] instanceof FetchMiddleware).toBeTruthy();
    });

    it("should return FetchMiddleware instance callback on build", async () => {
      const builder = new FetchBuilder({ baseUrl, options }).build();

      expect(typeof builder).toBe("function");

      const middleware = builder()({ endpoint: "some-endpoint" });

      expect(middleware instanceof FetchMiddleware).toBeTruthy();
    });

    describe("When using Builder methods", () => {
      it("should trigger onRequest method before making request", async () => {
        const methodFn = jest.fn();

        interceptBase(200);

        const builder = new FetchBuilder({ baseUrl, options })
          .onRequest((middleware) => {
            methodFn();
            return middleware;
          })
          .build();

        const middleware = builder()({
          endpoint: "/",
        });

        await middleware.send();

        expect(methodFn).toBeCalled();
      });

      it("should throw onRequest method when middleware is not returned", async () => {
        const methodFn = jest.fn();

        interceptBase(200);

        const builder = new FetchBuilder({ baseUrl, options })
          .onRequest((middleware) => {
            methodFn();
            return undefined as unknown as typeof middleware;
          })
          .build();

        const middleware = builder()({
          endpoint: "/",
        });

        expect(middleware.send()).rejects.toThrow();
      });

      it("should trigger onResponse method after making request", async () => {
        const methodFn = jest.fn();

        interceptBase(200);

        const builder = new FetchBuilder({ baseUrl, options })
          .onResponse((response) => {
            methodFn();
            return response;
          })
          .build();

        const middleware = builder()({
          endpoint: "/",
        });

        await middleware.send();

        expect(methodFn).toBeCalled();
      });

      it("should throw onResponse method when middleware is not returned", async () => {
        const methodFn = jest.fn();

        interceptBase(200);

        const builder = new FetchBuilder({ baseUrl, options })
          .onRequest((middleware) => {
            methodFn();
            return undefined as unknown as typeof middleware;
          })
          .build();

        const middleware = builder()({
          endpoint: "/",
        });

        expect(middleware.send()).rejects.toThrow();
      });
    });
  });
});
