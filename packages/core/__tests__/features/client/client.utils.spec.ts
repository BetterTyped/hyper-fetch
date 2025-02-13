import { createHttpMockingServer } from "@hyper-fetch/testing";

import { Client, interceptRequest, interceptResponse, stringifyDefaultOptions } from "client";
import { stringifyQueryParams } from "http-adapter";

const { resetMocks, startServer, stopServer } = createHttpMockingServer();

const options = {
  ...stringifyDefaultOptions,
  encode: true,
};

describe("Client [ Utils ]", () => {
  let client = new Client({ url: "shared-base-url" });
  client.adapter.setQueryParamsMapperConfig(options);
  let request = client.createRequest<{ payload: FormData; response: any }>()({ endpoint: "shared-nase-endpoint" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    client.adapter.setQueryParamsMapperConfig(options);
    request = client.createRequest<{ response: any; payload: FormData }>()({ endpoint: "shared-nase-endpoint" });
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using stringifyQueryParams util", () => {
    it("should encode falsy values", async () => {
      const newClient = new Client({ url: "shared-base-url" });
      newClient.adapter.setQueryParamsMapperConfig({
        encode: false,
        arrayFormat: "bracket",
      });
      expect(newClient.adapter.unsafe_queryParamsMapper({ value: { test: new Date("9,9,2020").toISOString() } })).toBe(
        `?value={"test":"${new Date("9,9,2020").toISOString()}"}`,
      );
      expect(
        newClient.adapter.unsafe_queryParamsMapper({
          page: 0,
          status: ["status1", "status2"],
          lastFreeDay: '{"from":"2023-06-20T10:37:27.508Z","to":"2023-06-24T10:37:27.508Z"}',
          account: "test-account/123+323-123|111:;",
        }),
      ).toBe(
        '?page=0&status[]=status1&status[]=status2&lastFreeDay={"from":"2023-06-20T10:37:27.508Z","to":"2023-06-24T10:37:27.508Z"}&account=test-account/123+323-123|111:;',
      );
    });
    it("should encode falsy values", async () => {
      expect(stringifyQueryParams({ value: 0 }, options)).toBe("?value=0");
      expect(stringifyQueryParams({ value: "" }, { ...options, skipEmptyString: false })).toBe("?value=");
      expect(stringifyQueryParams({ value: null }, { ...options, skipNull: false })).toBe("?value=null");
      expect(stringifyQueryParams({ value: "" }, { ...options, skipEmptyString: true })).toBe("");
      expect(stringifyQueryParams({ value: undefined }, { ...options, skipEmptyString: true })).toBe("");
      expect(stringifyQueryParams({ value: null }, { ...options, skipNull: true })).toBe("");
    });
    it("should encode date value to isoString by default", async () => {
      expect(stringifyQueryParams({ value: new Date("2023-05-12T22:32:32") }, options)).toInclude(`?value=2023-05-12`);
    });
    it("should encode truthy values", async () => {
      expect(stringifyQueryParams({ value: 10 }, options)).toBe("?value=10");
      expect(stringifyQueryParams({ value: "test" }, options)).toBe("?value=test");
      expect(stringifyQueryParams({ value: [1, 2, 3] }, options)).toBe("?value[]=1&value[]=2&value[]=3");
      expect(stringifyQueryParams({ value: { data: "test" } }, options)).toBe("?value=%7B%22data%22%3A%22test%22%7D");
      expect(
        stringifyQueryParams(
          {
            value: {
              filter: {
                firstName: "john",
                other: {
                  hobbies: ["dancing", "singing"],
                },
              },
            },
          },
          options,
        ),
      ).toBe(
        "?value=%7B%22filter%22%3A%7B%22firstName%22%3A%22john%22%2C%22other%22%3A%7B%22hobbies%22%3A%5B%22dancing%22%2C%22singing%22%5D%7D%7D%7D",
      );
    });
    it("should encode not allowed characters values", async () => {
      expect(stringifyQueryParams({ value: "[]" }, options)).toBe("?value=%5B%5D");
      expect(stringifyQueryParams({ value: "/" }, options)).toBe("?value=%2F");
      expect(stringifyQueryParams({ value: "," }, options)).toBe("?value=%2C");
      expect(stringifyQueryParams({ value: "|" }, options)).toBe("?value=%7C");
      expect(stringifyQueryParams({ value: ":" }, options)).toBe("?value=%3A");
      expect(stringifyQueryParams({ value: ";" }, options)).toBe("?value=%3B");
      expect(stringifyQueryParams({ value: "+" }, options)).toBe("?value=%2B");
      expect(stringifyQueryParams({ value: "(" }, options)).toBe("?value=%28");
      expect(stringifyQueryParams({ value: ")" }, options)).toBe("?value=%29");
      expect(stringifyQueryParams({ value: "*" }, options)).toBe("?value=%2A");
      expect(stringifyQueryParams({ value: "&" }, options)).toBe("?value=%26");
      expect(stringifyQueryParams({ value: "^" }, options)).toBe("?value=%5E");
      expect(stringifyQueryParams({ value: "%" }, options)).toBe("?value=%25");
      expect(stringifyQueryParams({ value: "$" }, options)).toBe("?value=%24");
      expect(stringifyQueryParams({ value: "#" }, options)).toBe("?value=%23");
      expect(stringifyQueryParams({ value: "@" }, options)).toBe("?value=%40");
      expect(stringifyQueryParams({ value: "!" }, options)).toBe("?value=%21");
    });
    it("should encode array values with different formats", async () => {
      expect(
        stringifyQueryParams({ value: [1, 2, 3] }, { ...options, arraySeparator: "", arrayFormat: "bracket" }),
      ).toBe("?value[]=1&value[]=2&value[]=3");
      expect(
        stringifyQueryParams(
          { value: [1, 2, 3] },
          { ...options, arraySeparator: "", arrayFormat: "bracket-separator" },
        ),
      ).toBe("?value[]=1|2|3");
      expect(stringifyQueryParams({ value: [1, 2, 3] }, { ...options, arraySeparator: "", arrayFormat: "comma" })).toBe(
        "?value=1,2,3",
      );
      expect(stringifyQueryParams({ value: [1, 2, 3] }, { ...options, arraySeparator: "", arrayFormat: "index" })).toBe(
        "?value[0]=1&value[1]=2&value[2]=3",
      );
      expect(stringifyQueryParams({ value: [1, 2, 3] }, { ...options, arraySeparator: "", arrayFormat: "none" })).toBe(
        "?value=1&value=2&value=3",
      );
      expect(
        stringifyQueryParams({ value: [1, 2, 3] }, { ...options, arraySeparator: "", arrayFormat: "separator" }),
      ).toBe("?value=1|2|3");
      expect(
        stringifyQueryParams({ value: [1, 2, 3] }, { ...options, arrayFormat: "separator", arraySeparator: "#" }),
      ).toBe("?value=1#2#3");
    });
    it("should encode values without strict option", async () => {
      expect(stringifyQueryParams({ value: "![]" }, { ...options, encode: true, strict: false })).toBe(
        "?value=!%5B%5D",
      );
      expect(stringifyQueryParams({ value: "![]" }, { ...options, encode: false, strict: false })).toBe("?value=![]");
      expect(stringifyQueryParams({ value: "![]" }, { ...options, encode: false, strict: true })).toBe("?value=![]");
    });
    it("should add the question mark", async () => {
      expect(stringifyQueryParams("something", options)).toBe("?something");
      expect(stringifyQueryParams("?something", options)).toBe("?something");
    });
    it("should return empty string when no query params are passed", async () => {
      expect(stringifyQueryParams("", options)).toBe("");
      expect(stringifyQueryParams({}, options)).toBe("");
      expect(stringifyQueryParams(null, options)).toBe("");
      expect(stringifyQueryParams(undefined, options)).toBe("");
    });
  });

  describe("When using headerMapper", () => {
    it("should assign default headers with headers mapper", async () => {
      const defaultHeaders = { "Content-Type": "application/json" };
      const headers = client.adapter.unsafe_headerMapper(request, undefined);

      expect(headers).toEqual(defaultHeaders);
    });
    it("should assign form data headers", async () => {
      const defaultHeaders = {};
      const data = new FormData();
      const formDataRequest = request.setPayload(data);
      const headers = client.adapter.unsafe_headerMapper(formDataRequest, undefined);

      expect(headers).toEqual(defaultHeaders);
    });
    it("should not re-assign form data headers", async () => {
      const defaultHeaders = { "Content-Type": "some-custom-format" };
      const formDataRequest = request.setHeaders(defaultHeaders);
      const headers = client.adapter.unsafe_headerMapper(formDataRequest, undefined);

      expect(headers).toEqual(defaultHeaders);
    });
  });

  describe("When using payloadMapper", () => {
    it("should allow to stringify payload", async () => {
      const data = { data: [] };
      const payload = client.adapter.unsafe_payloadMapper(data, undefined);

      expect(payload).toEqual(JSON.stringify(data));
    });
    it("should not stringify FormData payload", async () => {
      const data = new FormData();
      const payload = client.adapter.unsafe_payloadMapper(data, undefined);

      expect(payload).toEqual(data);
    });
    it("should stringify null payload", async () => {
      const data = null;
      const payload = client.adapter.unsafe_payloadMapper(data, undefined);

      expect(payload).toEqual(JSON.stringify(data));
    });
    it("should not stringify undefined payload", async () => {
      const payload = client.adapter.unsafe_payloadMapper(undefined, undefined);

      expect(payload).toBeUndefined();
    });
    it("should not stringify invalid payload", async () => {
      const payload = client.adapter.unsafe_payloadMapper(() => null, undefined);
      expect(payload).toBeUndefined();
    });
  });

  describe("When using stringifyValue util", () => {
    it("should allow to stringify payload", async () => {
      const data = { data: [] };
      const payload = client.adapter.unsafe_payloadMapper(data, undefined);

      expect(payload).toEqual(JSON.stringify(data));
    });
    it("should not stringify FormData payload", async () => {
      const data = new FormData();
      const payload = client.adapter.unsafe_payloadMapper(data, undefined);

      expect(payload).toEqual(data);
    });
    it("should stringify null payload", async () => {
      const data = null;
      const payload = client.adapter.unsafe_payloadMapper(data, undefined);

      expect(payload).toEqual(JSON.stringify(data));
    });
    it("should not stringify undefined payload", async () => {
      const payload = client.adapter.unsafe_payloadMapper(undefined, undefined);

      expect(payload).toBeUndefined();
    });
    it("should not stringify invalid payload", async () => {
      const data: Record<string, unknown> = {};
      data.a = { b: data };

      const payload = client.adapter.unsafe_payloadMapper(data, undefined);
      expect(payload).toBe("");
    });
  });

  describe("when interceptors are disabled", () => {
    it("should skip request interceptors when disabled", async () => {
      const mockInterceptor = jest.fn((req) => req);
      const req = client.createRequest<{ response: any }>()({
        endpoint: "shared-base-endpoint",
        disableRequestInterceptors: true,
      });

      const result = await interceptRequest([mockInterceptor], req);

      expect(mockInterceptor).not.toHaveBeenCalled();
      expect(result).toBe(req);
    });

    it("should skip response interceptors when disabled", async () => {
      const mockInterceptor = jest.fn((res) => res);
      const response = {
        data: { test: "data" },
        status: 200,
        success: true,
      } as any;
      const req = client.createRequest<{ response: any }>()({
        endpoint: "shared-base-endpoint",
        disableResponseInterceptors: true,
      });

      const result = await interceptResponse([mockInterceptor], response, req);

      expect(mockInterceptor).not.toHaveBeenCalled();
      expect(result).toBe(response);
    });

    it("should run interceptors when not disabled", async () => {
      const mockInterceptor = jest.fn((req) => req);

      const req = client.createRequest<{ response: any }>()({
        endpoint: "shared-base-endpoint",
        disableRequestInterceptors: false,
      });

      await interceptRequest([mockInterceptor], req);

      expect(mockInterceptor).toHaveBeenCalledWith(req);
    });
  });
});
