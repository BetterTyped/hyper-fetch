import { ClientType, FetchClientOptions } from "client";
import { FetchBuilder, FetchMiddleware } from "middleware";
import { interceptBase } from "../../utils/mocks";
import { startServer, stopServer } from "../../utils/server";

const baseUrl = "some-url";
const options: FetchClientOptions = { timeout: 1000 };

describe("Basic FetchBuilder usage", () => {
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

  it("should apply custom client", async () => {
    const customHttpClient: ClientType<any, any> = () => Promise.resolve([null, null, 0]);

    const builder = new FetchBuilder({ baseUrl, options }).setClient(customHttpClient);

    expect(builder.client).toBe(customHttpClient);
  });

  it("should call the methods", async () => {
    startServer();

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
      .onResponse((middleware, response) => {
        responseCall(middleware, response);
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

    expect(responseCall.mock.calls[0][0] instanceof FetchMiddleware).toBeTruthy();
    expect(responseCall.mock.calls[0][1]).toEqual([null, { message: "Error" }, 400]);
    stopServer();
  });

  it("should return FetchMiddleware instance callback on build", async () => {
    const builder = new FetchBuilder({ baseUrl, options }).build();

    expect(typeof builder).toBe("function");

    const middleware = builder()({ endpoint: "some-endpoint" });

    expect(middleware instanceof FetchMiddleware).toBeTruthy();
  });
});
