import { FetchBuilder } from "builder";
import { FetchCommandOptions } from "command";
import { ClientResponseType, ClientType } from "client";
import { resetMocks, startServer, stopServer } from "../../utils/server";
import { getManyRequest, interceptGetMany } from "../../utils/mocks/get-many.mock";

const options = {
  endpoint: "/some-endpoint",
};

describe("Basic FetchCommand usage", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should assign provided props", async () => {
    const props: FetchCommandOptions<any, any> = {
      method: "POST",
      endpoint: "/some-endpoint",
      headers: { "Content-Type": "custom" },
      options: { timeout: 1000 },
      disableResponseInterceptors: true,
      disableRequestInterceptors: true,
    };

    const command = new FetchBuilder({ baseUrl: "/some-url" }).create()(props);

    expect(command.method).toBe(props.method);
    expect(command.endpoint).toBe(props.endpoint);
    expect(command.headers).toStrictEqual(props.headers);
    expect(command.commandOptions.options).toStrictEqual(props.options);
    expect(command.commandOptions.disableResponseInterceptors).toBe(props.disableResponseInterceptors);
    expect(command.commandOptions.disableRequestInterceptors).toBe(props.disableRequestInterceptors);
  });

  it("should initialize with applied methods", async () => {
    const callback: any = () => null;

    const builder = new FetchBuilder({ baseUrl: "/some-url" });
    const command = builder
      .create()(options)
      .onRequestStart(callback)
      .onResponseStart(callback)
      .onRequestProgress(callback)
      .onResponseProgress(callback)
      .onError(callback)
      .onSuccess(callback)
      .onFinished(callback);

    expect(command.requestStartCallback).toBeDefined();
    expect(command.responseStartCallback).toBeDefined();
    expect(command.requestProgressCallback).toBeDefined();
    expect(command.responseProgressCallback).toBeDefined();
    expect(command.onErrorCallback).toBeDefined();
    expect(command.onSuccessCallback).toBeDefined();
    expect(command.onFinishedCallback).toBeDefined();
  });

  it("should allow to set data using setData method", async () => {
    const customDataOne = { someData: 1 };
    const customDataTwo = { someData: 2 };

    const builder = new FetchBuilder({ baseUrl: "/some-url" });
    const command = builder.create<any, any>()(options).setData(customDataOne);

    expect(command.data).toStrictEqual(customDataOne);

    const updated = command.setData(customDataTwo);

    expect(updated.data).toStrictEqual(customDataTwo);
  });

  it("should allow to set params using setParams method", async () => {
    const endpoint = "/params-endpoint/:someKey/:userId";

    const customParamsOne = { someKey: 1, userId: 2 };
    const customParamsTwo = { someKey: 3, userId: 4 };

    const builder = new FetchBuilder({ baseUrl: "/some-url" });
    const command = builder
      .create<any, any>()({ ...options, endpoint })
      .setParams(customParamsOne);

    expect(command.params).toStrictEqual(customParamsOne);
    expect(command.endpoint).toBe(`/params-endpoint/${customParamsOne.someKey}/${customParamsOne.userId}`);

    const updated = command.setParams(customParamsTwo);

    expect(updated.params).toStrictEqual(customParamsTwo);
    expect(updated.endpoint).toBe(`/params-endpoint/${customParamsTwo.someKey}/${customParamsTwo.userId}`);
  });

  it("should allow to set query params using setQueryParams method", async () => {
    const customQueryParamsOne = { "some-query": true };
    const customQueryParamsTwo = { "some-query-changed": false };

    const builder = new FetchBuilder({ baseUrl: "/some-url" });
    const command = builder.create<any, any>()(options).setQueryParams(customQueryParamsOne);

    expect(command.queryParams).toStrictEqual(customQueryParamsOne);

    const updated = command.setQueryParams(customQueryParamsTwo);

    expect(updated.queryParams).toStrictEqual(customQueryParamsTwo);
  });

  it("should allow to mock response using mock method", async () => {
    const mockData: ClientResponseType<any, any> = [{ myData: 123 }, null, 200];

    const builder = new FetchBuilder({ baseUrl: "/some-url" });
    const command = builder
      .create<any, any>()(options)
      .mock(() => mockData);

    const data = await command.send();

    expect(data).toStrictEqual(mockData);
  });

  it("should allow to trigger http client request using send method", async () => {
    let triggered = false;
    const mockData: ClientResponseType<any, any> = [{ myData: 123 }, null, 200];

    const customHttpClient: ClientType<any, any> = () => {
      triggered = true;
      return Promise.resolve(mockData);
    };

    const builder = new FetchBuilder({ baseUrl: "/some-url" }).setClient(customHttpClient);
    const command = builder.create<any, any>()(options);

    const data = await command.send();

    expect(triggered).toBeTruthy();
    expect(data).toStrictEqual(mockData);
  });

  it("should allow to track response and request progress", async () => {
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
  });

  it("should trigger onRequestStart and onResponseStart callback when response and request starts", async () => {
    interceptGetMany(200);

    const startReqFn = jest.fn();
    const startResFn = jest.fn();

    await getManyRequest.onRequestStart(startReqFn).onResponseStart(startResFn).send();

    expect(startReqFn).toBeCalledTimes(1);
    expect(startResFn).toBeCalledTimes(1);
  });

  it("should trigger onError callback once error occurs", async () => {
    interceptGetMany(400);

    const errorFn = jest.fn();

    await getManyRequest.onError(errorFn).send();

    expect(errorFn).toBeCalledTimes(1);
  });

  it("should trigger onSuccess callback once request is successful", async () => {
    interceptGetMany(200);

    const successFn = jest.fn();

    await getManyRequest.onSuccess(successFn).send();

    expect(successFn).toBeCalledTimes(1);
  });

  it("should trigger onFinished callback once request is successful or failed", async () => {
    interceptGetMany(200);

    const finishedFn = jest.fn();

    await getManyRequest.onFinished(finishedFn).send();

    interceptGetMany(400);

    await getManyRequest.onFinished(finishedFn).send();

    expect(finishedFn).toBeCalledTimes(2);
  });

  it("should map params with the endpoint", async () => {
    const endpoint = "/some-endpoint/:someParam/:someId";
    const params = { someParam: 1, someId: 2 };

    const expectedEndpoint = "/some-endpoint/1/2";

    const builder = new FetchBuilder({ baseUrl: "/some-url" });
    const command = builder
      .create<any, any>()({
        endpoint,
      })
      .setParams(params);

    expect(command.endpoint).toBe(expectedEndpoint);
  });

  it("should map params with the endpoint", async () => {
    const endpoint = "/some-endpoint/:someParam/:someId";
    const params = { someParam: 1, someId: 2 };

    const expectedEndpoint = "/some-endpoint/1/2";

    const builder = new FetchBuilder({ baseUrl: "/some-url" });
    const command = builder
      .create<any, any>()({
        endpoint,
      })
      .setParams(params);

    expect(command.endpoint).toBe(expectedEndpoint);
  });
});
