import { FetchBuilder, FetchMiddlewareOptions } from "middleware";
import { ClientResponseType, ClientType } from "client";
import { startServer, stopServer } from "tests/utils/server";
import { getManyRequest, interceptGetMany } from "../../utils/mocks/get-many.mock";

const options = {
  endpoint: "/some-endpoint",
};

describe("Basic FetchMiddleware usage", () => {
  it("should assign provided props", async () => {
    const props: FetchMiddlewareOptions<any, any> = {
      method: "POST",
      endpoint: "/some-endpoint",
      headers: { "Content-Type": "custom" },
      options: { timeout: 1000 },
      disableResponseInterceptors: true,
      disableRequestInterceptors: true,
    };

    const middleware = new FetchBuilder({ baseUrl: "/some-url" }).build()()(props);

    expect(middleware.method).toBe(props.method);
    expect(middleware.endpoint).toBe(props.endpoint);
    expect(middleware.headers).toStrictEqual(props.headers);
    expect(middleware.apiConfig.options).toStrictEqual(props.options);
    expect(middleware.apiConfig.disableResponseInterceptors).toBe(props.disableResponseInterceptors);
    expect(middleware.apiConfig.disableRequestInterceptors).toBe(props.disableRequestInterceptors);
  });

  it("should initialize with applied methods", async () => {
    const callback: any = () => null;

    const builder = new FetchBuilder({ baseUrl: "/some-url" }).build();
    const middleware = builder()(options)
      .onRequestStart(callback)
      .onResponseStart(callback)
      .onRequestProgress(callback)
      .onResponseProgress(callback)
      .onError(callback)
      .onSuccess(callback)
      .onFinished(callback);

    expect(middleware.requestStartCallback).toBeDefined();
    expect(middleware.responseStartCallback).toBeDefined();
    expect(middleware.requestProgressCallback).toBeDefined();
    expect(middleware.responseProgressCallback).toBeDefined();
    expect(middleware.onErrorCallback).toBeDefined();
    expect(middleware.onSuccessCallback).toBeDefined();
    expect(middleware.onFinishedCallback).toBeDefined();
  });

  it("should allow to set data using setData method", async () => {
    const customDataOne = { someData: 1 };
    const customDataTwo = { someData: 2 };

    const builder = new FetchBuilder({ baseUrl: "/some-url" }).build();
    const middleware = builder<any, any>()(options).setData(customDataOne);

    expect(middleware.data).toStrictEqual(customDataOne);

    const updated = middleware.setData(customDataTwo);

    expect(updated.data).toStrictEqual(customDataTwo);
  });

  it("should allow to set params using setParams method", async () => {
    const endpoint = "/params-endpoint/:someKey/:userId";

    const customParamsOne = { someKey: 1, userId: 2 };
    const customParamsTwo = { someKey: 3, userId: 4 };

    const builder = new FetchBuilder({ baseUrl: "/some-url" }).build();
    const middleware = builder<any, any>()({ ...options, endpoint }).setParams(customParamsOne);

    expect(middleware.params).toStrictEqual(customParamsOne);
    expect(middleware.endpoint).toBe(`/params-endpoint/${customParamsOne.someKey}/${customParamsOne.userId}`);

    const updated = middleware.setParams(customParamsTwo);

    expect(updated.params).toStrictEqual(customParamsTwo);
    expect(updated.endpoint).toBe(`/params-endpoint/${customParamsTwo.someKey}/${customParamsTwo.userId}`);
  });

  it("should allow to set query params using setQueryParams method", async () => {
    const customQueryParamsOne = "?some-query=true";
    const customQueryParamsTwo = "?some-query-changed=false";

    const builder = new FetchBuilder({ baseUrl: "/some-url" }).build();
    const middleware = builder<any, any>()(options).setQueryParams(customQueryParamsOne);

    expect(middleware.queryParams).toStrictEqual(customQueryParamsOne);

    const updated = middleware.setQueryParams(customQueryParamsTwo);

    expect(updated.queryParams).toStrictEqual(customQueryParamsTwo);
  });

  it("should allow to mock response using mock method", async () => {
    const mockData: ClientResponseType<any, any> = [{ myData: 123 }, null, 200];

    const builder = new FetchBuilder({ baseUrl: "/some-url" }).build();
    const middleware = builder<any, any>()(options).mock(() => mockData);

    const data = await middleware.send();

    expect(data).toStrictEqual(mockData);
  });

  it("should allow to trigger http client request using send method", async () => {
    let triggered = false;
    const mockData: ClientResponseType<any, any> = [{ myData: 123 }, null, 200];

    const customHttpClient: ClientType<any, any> = () => {
      triggered = true;
      return Promise.resolve(mockData);
    };

    const builder = new FetchBuilder({ baseUrl: "/some-url" }).setClient(customHttpClient).build();
    const middleware = builder<any, any>()(options);

    const data = await middleware.send();

    expect(triggered).toBeTruthy();
    expect(data).toStrictEqual(mockData);
  });

  it("should allow to track response and request progress", async () => {
    startServer();

    interceptGetMany(200);

    let reqProgress = 0;
    let resProgress = 0;

    await getManyRequest
      .onRequestProgress(({ progress }) => {
        reqProgress = progress;
      })
      .onResponseProgress(({ progress }) => {
        resProgress = progress;
      })
      .send();

    expect(reqProgress).toBe(100);
    expect(resProgress).toBe(100);

    stopServer();
  });

  it("should trigger onRequestStart and onResponseStart callback when response and request starts", async () => {
    startServer();

    interceptGetMany(200);

    const startReqFn = jest.fn();
    const startResFn = jest.fn();

    await getManyRequest.onRequestStart(startReqFn).onResponseStart(startResFn).send();

    expect(startReqFn).toBeCalledTimes(1);
    expect(startResFn).toBeCalledTimes(1);
    stopServer();
  });

  it("should trigger onError callback once error occurs", async () => {
    startServer();

    interceptGetMany(400);

    const errorFn = jest.fn();

    await getManyRequest.onError(errorFn).send();

    expect(errorFn).toBeCalledTimes(1);

    stopServer();
  });

  it("should trigger onSuccess callback once request is successful", async () => {
    startServer();

    interceptGetMany(200);

    const successFn = jest.fn();

    await getManyRequest.onSuccess(successFn).send();

    expect(successFn).toBeCalledTimes(1);

    stopServer();
  });

  it("should trigger onFinished callback once request is successful or failed", async () => {
    startServer();

    interceptGetMany(200);

    const finishedFn = jest.fn();

    await getManyRequest.onFinished(finishedFn).send();

    interceptGetMany(400);

    await getManyRequest.onFinished(finishedFn).send();

    expect(finishedFn).toBeCalledTimes(2);

    stopServer();
  });
});
