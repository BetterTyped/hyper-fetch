import { Client, createClient } from "client";
import { Adapter, AdapterInstance, RequestProcessingError, getAdapterHeaders, getAdapterPayload } from "adapter";
import { HttpMethods } from "../../../src/constants/http.constants";

describe("Adapter [ Base ]", () => {
  let adapter: AdapterInstance;

  beforeEach(() => {
    adapter = new Adapter({
      name: "test-adapter",
      defaultMethod: HttpMethods.GET,
      defaultExtra: {},
      systemErrorStatus: 0,
      systemErrorExtra: {},
    });
  });

  describe("when setting mapper configs", () => {
    it("should set query params mapper config", () => {
      const config = { test: true };
      adapter.setQueryParamsMapperConfig(config);
      expect(adapter.unsafe_queryParamsMapperConfig).toBe(config);
    });

    it("should set header mapper config", () => {
      const config = { test: true };
      adapter.setHeaderMapperConfig(config);
      expect(adapter.unsafe_headerMapperConfig).toBe(config);
    });

    it("should set endpoint mapper config", () => {
      const config = { test: true };
      adapter.setEndpointMapperConfig(config);
      expect(adapter.unsafe_endpointMapperConfig).toBe(config);
    });

    it("should set payload mapper config", () => {
      const config = { test: true };
      adapter.setPayloadMapperConfig(config);
      expect(adapter.unsafe_payloadMapperConfig).toBe(config);
    });
  });

  describe("when using onInitialize", () => {
    it("should store and execute initialization callback", () => {
      const spy = jest.fn();
      const client = new Client({ url: "test" });

      adapter.onInitialize(spy);
      adapter.initialize(client);

      expect(spy).toHaveBeenCalledWith({ client });
      expect(adapter.unsafe_onInitializeCallback).toBe(spy);
    });

    it("should handle initialization without callback", () => {
      const client = new Client({ url: "test" });

      // Initialize without setting onInitialize callback
      expect(() => adapter.initialize(client)).not.toThrow();
      expect(adapter.unsafe_onInitializeCallback).toBeUndefined();
      expect(adapter.initialized).toBe(true);
      expect(adapter.client).toBe(client);
    });

    it("should handle initialization with callback set to undefined", () => {
      const client = new Client({ url: "test" });

      // Initialize without setting onInitialize callback
      adapter.unsafe_onInitializeCallback = undefined;
      expect(() => adapter.initialize(client)).not.toThrow();
      expect(adapter.unsafe_onInitializeCallback).toBeUndefined();
      expect(adapter.initialized).toBe(true);
      expect(adapter.client).toBe(client);
    });
  });

  describe("when using setFetcher", () => {
    it("should bind fetcher function to adapter instance", () => {
      const mock = { test: 123 } as any;
      const fetcher = () => {
        return mock;
      };

      adapter.setFetcher(fetcher);
      const result = adapter.unsafe_fetcher({} as any);

      expect(result).toBe(mock);
    });
  });

  describe("when using mapper setters", () => {
    it("should set header mapper with config", () => {
      const headerMapper = jest.fn();
      const config = { test: true };

      adapter.setHeaderMapperConfig(config);
      adapter.setHeaderMapper(headerMapper);
      adapter.unsafe_headerMapper({} as any);

      expect(headerMapper).toHaveBeenCalledWith({}, config);
    });

    it("should set payload mapper with config", () => {
      const payloadMapper = jest.fn();
      const config = { test: true };

      adapter.setPayloadMapperConfig(config);
      adapter.setPayloadMapper(payloadMapper);
      adapter.unsafe_payloadMapper({} as any);

      expect(payloadMapper).toHaveBeenCalledWith({}, config);
    });

    it("should set endpoint mapper with config", () => {
      const endpointMapper = jest.fn();
      const config = { test: true };

      adapter.setEndpointMapperConfig(config);
      adapter.setEndpointMapper(endpointMapper);
      adapter.unsafe_endpointMapper("test");

      expect(endpointMapper).toHaveBeenCalledWith("test", config);
    });

    it("should set query params mapper with config", () => {
      const queryParamsMapper = jest.fn();
      const config = { test: true };

      adapter.setQueryParamsMapperConfig(config);
      adapter.setQueryParamsMapper(queryParamsMapper);
      adapter.unsafe_queryParamsMapper({} as any);

      expect(queryParamsMapper).toHaveBeenCalledWith({}, config);
    });
  });

  describe("when using defaults setters", () => {
    it("should set request defaults", () => {
      const defaults = { method: HttpMethods.POST };
      const callback = jest.fn().mockReturnValue(defaults);

      adapter.setRequestDefaults(callback);
      const result = adapter.unsafe_getRequestDefaults?.({} as any);

      expect(callback).toHaveBeenCalledWith({});
      expect(result).toBe(defaults);
    });

    it("should set adapter defaults", () => {
      const defaults = { timeout: 5000 };
      const callback = jest.fn().mockReturnValue(defaults);

      adapter.setAdapterDefaults(callback);
      const result = adapter.unsafe_getAdapterDefaults?.({} as any);

      expect(callback).toHaveBeenCalledWith({});
      expect(result).toBe(defaults);
    });

    it("should set internal error mapping callback", () => {
      const errorMapping = (error: any) => ({ customError: error });
      const callback = jest.fn().mockImplementation(errorMapping);

      adapter.setInternalErrorMapping(callback);

      expect(adapter.unsafe_internalErrorMapping).toBe(callback);
    });
  });

  describe("when checking default mappers", () => {
    it("should have default header mapper", () => {
      expect(adapter.unsafe_headerMapper).toBe(getAdapterHeaders);
    });

    it("should have default payload mapper", () => {
      expect(adapter.unsafe_payloadMapper).toBe(getAdapterPayload);
    });
  });

  describe("when using fetch", () => {
    it("should throw error if adapter is not initialized", async () => {
      const newAdapter = new Adapter({
        name: "test-adapter",
        defaultMethod: HttpMethods.GET,
        defaultExtra: {},
        systemErrorStatus: 0,
        systemErrorExtra: {},
      });

      const client = createClient({ url: "test" });
      const request = client.createRequest()({
        endpoint: "test",
      });

      // hack to prevent logger from being missed (not initialized)
      newAdapter.logger = client.loggerManager.initialize(client, "Adapter");

      const data = await newAdapter.fetch(request, "test");

      expect(data.error.message).toStrictEqual(
        new RequestProcessingError("Adapter test-adapter is not initialized").message,
      );
      expect(data.error.description).toStrictEqual(
        new RequestProcessingError("Adapter test-adapter is not initialized").description,
      );
    });

    it("should throw error if fetcher is not set", async () => {
      const newAdapter = new Adapter({
        name: "test-adapter",
        defaultMethod: HttpMethods.GET,
        defaultExtra: {},
        systemErrorStatus: 0,
        systemErrorExtra: {},
      });

      const client = createClient({ url: "test" }).setAdapter(newAdapter);
      const request = client.createRequest()({
        endpoint: "test",
      });

      const data = await client.adapter.fetch(request, "test");

      expect(data.error.message).toStrictEqual(
        new RequestProcessingError("Fetcher for test-adapter adapter is not set").message,
      );
      expect(data.error.description).toStrictEqual(
        new RequestProcessingError("Fetcher for test-adapter adapter is not set").description,
      );
    });

    it("should execute fetcher with adapter bindings", async () => {
      const fetcherSpy = jest.fn().mockImplementation(({ onSuccess }) => {
        onSuccess({
          data: {},
          status: 200,
          extra: {},
          error: null,
        });
      });

      const newAdapter = new Adapter({
        name: "test-adapter",
        defaultMethod: HttpMethods.GET,
        defaultExtra: {},
        systemErrorStatus: 0,
        systemErrorExtra: {},
      }).setFetcher(fetcherSpy);

      const client = new Client({ url: "test" });
      const request = client.createRequest()({
        endpoint: "test",
      });
      client.setAdapter(newAdapter);

      await client.adapter.fetch(request, "test");

      expect(fetcherSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.any(Object),
          requestId: "test",
        }),
      );
    });

    it("should trigger plugins on adapter fetch", async () => {
      const fetcherSpy = jest.fn().mockImplementation(({ onSuccess }) => {
        onSuccess({
          data: {},
          status: 200,
          extra: {},
          error: null,
        });
      });

      const client = new Client({ url: "test" });
      const pluginSpy = jest.fn();
      client.triggerPlugins = pluginSpy;

      const newAdapter = new Adapter({
        name: "test-adapter",
        defaultMethod: HttpMethods.GET,
        defaultExtra: {},
        systemErrorStatus: 0,
        systemErrorExtra: {},
      }).setFetcher(fetcherSpy);

      const request = client.createRequest()({
        endpoint: "test",
      });
      client.setAdapter(newAdapter);

      await client.adapter.fetch(request, "test");

      expect(pluginSpy).toHaveBeenCalledWith("onAdapterFetch", {
        adapter: newAdapter,
        request,
        requestId: "test",
      });
    });

    it("should use mocker when mock is enabled", async () => {
      const mockResponse = {
        data: { mocked: true } as any,
        status: 200,
        extra: { headers: {} },
      };

      const client = new Client({ url: "test" });
      const request = client
        .createRequest()({
          endpoint: "test",
        })
        .setMock(() => {
          return mockResponse;
        });

      client.requestManager.addAbortController(request.abortKey, "test");
      const response = await client.adapter.fetch(request, "test");

      expect(response).toStrictEqual(expect.objectContaining(mockResponse));
    });

    it("should handle errors during fetch execution", async () => {
      const testError = new Error("Test error");
      const fetcherSpy = jest.fn().mockImplementation(() => {
        throw testError;
      });

      const client = new Client({ url: "test" });
      const newAdapter = new Adapter({
        name: "test-adapter",
        defaultMethod: HttpMethods.GET,
        defaultExtra: { extraData: true },
        systemErrorStatus: 500,
        systemErrorExtra: { systemError: true },
      }).setFetcher(fetcherSpy);

      const request = client.createRequest()({
        endpoint: "test",
      });
      client.setAdapter(newAdapter);

      const response = await client.adapter.fetch(request, "test");

      expect(response).toEqual(
        expect.objectContaining({
          data: null,
          error: testError,
          status: 500,
          extra: { systemError: true },
        }),
      );
    });

    it("should use current timestamp if startTime is not set during error", async () => {
      const fetcherSpy = jest.fn().mockImplementation(() => {
        throw new Error("Test error");
      });

      const client = new Client({ url: "test" });
      const newAdapter = new Adapter({
        name: "test-adapter",
        defaultMethod: HttpMethods.GET,
        defaultExtra: {},
        systemErrorStatus: 500,
        systemErrorExtra: {},
      }).setFetcher(fetcherSpy);

      const request = client.createRequest()({
        endpoint: "test",
      });
      client.setAdapter(newAdapter);

      const response = await client.adapter.fetch(request, "test");

      expect(response.requestTimestamp).toBeNumber();
    });
  });
});
