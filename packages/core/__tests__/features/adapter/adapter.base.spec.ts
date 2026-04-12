import { Client, createClient } from "client";
import type { AdapterInstance } from "adapter";
import { Adapter, RequestProcessingError, getAdapterHeaders, getAdapterPayload } from "adapter";
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
      expect(adapter.unstable_queryParamsMapperConfig).toBe(config);
    });

    it("should set header mapper config", () => {
      const config = { test: true };
      adapter.setHeaderMapperConfig(config);
      expect(adapter.unstable_headerMapperConfig).toBe(config);
    });

    it("should set endpoint mapper config", () => {
      const config = { test: true };
      adapter.setEndpointMapperConfig(config);
      expect(adapter.unstable_endpointMapperConfig).toBe(config);
    });

    it("should set payload mapper config", () => {
      const config = { test: true };
      adapter.setPayloadMapperConfig(config);
      expect(adapter.unstable_payloadMapperConfig).toBe(config);
    });
    it("should set devtools endpoint getter", () => {
      const mapper = (endpoint: string) => endpoint;
      adapter.setDevtoolsEndpointGetter(mapper);
      expect(adapter.unstable_devtoolsEndpointGetter).toBe(mapper);
    });
  });

  describe("when using onInitialize", () => {
    it("should store and execute initialization callback", () => {
      const spy = vi.fn();
      const client = new Client({ url: "test" });

      adapter.onInitialize(spy);
      adapter.initialize(client);

      expect(spy).toHaveBeenCalledWith({ client });
      expect(adapter.unstable_onInitializeCallback).toBe(spy);
    });

    it("should handle initialization without callback", () => {
      const client = new Client({ url: "test" });

      // Initialize without setting onInitialize callback
      expect(() => adapter.initialize(client)).not.toThrow();
      expect(adapter.unstable_onInitializeCallback).toBeUndefined();
      expect(adapter.initialized).toBe(true);
      expect(adapter.client).toBe(client);
    });

    it("should handle initialization with callback set to undefined", () => {
      const client = new Client({ url: "test" });

      // Initialize without setting onInitialize callback
      adapter.unstable_onInitializeCallback = undefined;
      expect(() => adapter.initialize(client)).not.toThrow();
      expect(adapter.unstable_onInitializeCallback).toBeUndefined();
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
      const result = adapter.unstable_fetcher({} as any);

      expect(result).toBe(mock);
    });
  });

  describe("when using mapper setters", () => {
    it("should set header mapper with config", () => {
      const headerMapper = vi.fn();
      const config = { test: true };

      adapter.setHeaderMapperConfig(config);
      adapter.setHeaderMapper(headerMapper);
      adapter.unstable_headerMapper({} as any);

      expect(headerMapper).toHaveBeenCalledWith({}, config);
    });

    it("should set payload mapper with config", () => {
      const payloadMapper = vi.fn();
      const config = { test: true };

      adapter.setPayloadMapperConfig(config);
      adapter.setPayloadMapper(payloadMapper);
      adapter.unstable_payloadMapper({} as any);

      expect(payloadMapper).toHaveBeenCalledWith({}, config);
    });

    it("should set endpoint mapper with config", () => {
      const endpointMapper = vi.fn();
      const config = { test: true };

      adapter.setEndpointMapperConfig(config);
      adapter.setEndpointMapper(endpointMapper);
      adapter.unstable_endpointMapper("test");

      expect(endpointMapper).toHaveBeenCalledWith("test", config);
    });

    it("should set query params mapper with config", () => {
      const queryParamsMapper = vi.fn();
      const config = { test: true };

      adapter.setQueryParamsMapperConfig(config);
      adapter.setQueryParamsMapper(queryParamsMapper);
      adapter.unstable_queryParamsMapper({} as any);

      expect(queryParamsMapper).toHaveBeenCalledWith({}, config);
    });
  });

  describe("when using defaults setters", () => {
    it("should set request defaults", () => {
      const defaults = { method: HttpMethods.POST };
      const callback = vi.fn().mockReturnValue(defaults);

      adapter.setRequestDefaults(callback);
      const result = adapter.unstable_getRequestDefaults?.({} as any);

      expect(callback).toHaveBeenCalledWith({});
      expect(result).toBe(defaults);
    });

    it("should set adapter defaults", () => {
      const defaults = { timeout: 5000 };
      const callback = vi.fn().mockReturnValue(defaults);

      adapter.setAdapterDefaults(callback);
      const result = adapter.unstable_getAdapterDefaults?.({} as any);

      expect(callback).toHaveBeenCalledWith({});
      expect(result).toBe(defaults);
    });

    it("should set internal error mapping callback", () => {
      const errorMapping = (error: any) => ({ customError: error });
      const callback = vi.fn().mockImplementation(errorMapping);

      adapter.setInternalErrorMapping(callback);

      expect(adapter.unstable_internalErrorMapping).toBe(callback);
    });
  });

  describe("when using default unstable_devtoolsEndpointGetter", () => {
    it("should return the endpoint unchanged by default", () => {
      const result = adapter.unstable_devtoolsEndpointGetter("/test/endpoint");
      expect(result).toBe("/test/endpoint");
    });
  });

  describe("when using unstable_getRequestDefaults", () => {
    it("should allow setting and calling unstable_getRequestDefaults", () => {
      const defaults = { method: HttpMethods.POST };
      const callback = vi.fn().mockReturnValue(defaults);

      adapter.setRequestDefaults(callback);
      expect(adapter.unstable_getRequestDefaults).toBeDefined();

      const result = adapter.unstable_getRequestDefaults!({
        endpoint: "/test",
      } as any);
      expect(callback).toHaveBeenCalledWith({ endpoint: "/test" });
      expect(result).toBe(defaults);
    });

    it("should be undefined by default", () => {
      expect(adapter.unstable_getRequestDefaults).toBeUndefined();
    });
  });

  describe("when checking default mappers", () => {
    it("should have default header mapper", () => {
      expect(adapter.unstable_headerMapper).toBe(getAdapterHeaders);
    });

    it("should have default payload mapper", () => {
      expect(adapter.unstable_payloadMapper).toBe(getAdapterPayload);
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

      const data = await newAdapter.fetch(request as any, "test");

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
      const fetcherSpy = vi.fn().mockImplementation(({ onSuccess }) => {
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
      const fetcherSpy = vi.fn().mockImplementation(({ onSuccess }) => {
        onSuccess({
          data: {},
          status: 200,
          extra: {},
          error: null,
        });
      });

      const client = new Client({ url: "test" });
      const pluginSpy = vi.fn();
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
      const fetcherSpy = vi.fn().mockImplementation(() => {
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
      const fetcherSpy = vi.fn().mockImplementation(() => {
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
