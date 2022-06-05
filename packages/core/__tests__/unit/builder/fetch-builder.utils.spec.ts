import { stringifyQueryParams } from "builder";
import { resetInterceptors, startServer, stopServer } from "../../server";
import { createBuilder, createCommand } from "../../utils";

describe("Builder [ Utils ]", () => {
  let builder = createBuilder();
  let command = createCommand(builder);

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    builder = createBuilder();
    command = createCommand(builder);
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using stringifyQueryParams util", () => {
    it("should encode falsy values", async () => {
      expect(stringifyQueryParams({ value: 0 })).toBe("?value=0");
      expect(stringifyQueryParams({ value: "" }, { skipEmptyString: false })).toBe("?value=");
      expect(stringifyQueryParams({ value: null }, { skipNull: false })).toBe("?value=null");
      expect(stringifyQueryParams({ value: "" }, { skipEmptyString: true })).toBe("");
      expect(stringifyQueryParams({ value: undefined }, { skipEmptyString: true })).toBe("");
      expect(stringifyQueryParams({ value: null }, { skipNull: true })).toBe("");
    });
    it("should encode truthy values", async () => {
      expect(stringifyQueryParams({ value: 10 })).toBe("?value=10");
      expect(stringifyQueryParams({ value: "test" })).toBe("?value=test");
      expect(stringifyQueryParams({ value: [1, 2, 3] })).toBe("?value[]=1&value[]=2&value[]=3");
      expect(stringifyQueryParams({ value: { data: "test" } })).toBe("?value=%5Bobject%20Object%5D");
    });
    it("should encode not allowed characters values", async () => {
      expect(stringifyQueryParams({ value: "[]" })).toBe("?value=%5B%5D");
      expect(stringifyQueryParams({ value: "/" })).toBe("?value=%2F");
      expect(stringifyQueryParams({ value: "," })).toBe("?value=%2C");
      expect(stringifyQueryParams({ value: "|" })).toBe("?value=%7C");
      expect(stringifyQueryParams({ value: ":" })).toBe("?value=%3A");
      expect(stringifyQueryParams({ value: ";" })).toBe("?value=%3B");
      expect(stringifyQueryParams({ value: "+" })).toBe("?value=%2B");
      expect(stringifyQueryParams({ value: "(" })).toBe("?value=%28");
      expect(stringifyQueryParams({ value: ")" })).toBe("?value=%29");
      expect(stringifyQueryParams({ value: "*" })).toBe("?value=%2A");
      expect(stringifyQueryParams({ value: "&" })).toBe("?value=%26");
      expect(stringifyQueryParams({ value: "^" })).toBe("?value=%5E");
      expect(stringifyQueryParams({ value: "%" })).toBe("?value=%25");
      expect(stringifyQueryParams({ value: "$" })).toBe("?value=%24");
      expect(stringifyQueryParams({ value: "#" })).toBe("?value=%23");
      expect(stringifyQueryParams({ value: "@" })).toBe("?value=%40");
      expect(stringifyQueryParams({ value: "!" })).toBe("?value=%21");
    });
    it("should encode array values with different formats", async () => {
      expect(stringifyQueryParams({ value: [1, 2, 3] }, { arrayFormat: "bracket" })).toBe(
        "?value[]=1&value[]=2&value[]=3",
      );
      expect(stringifyQueryParams({ value: [1, 2, 3] }, { arrayFormat: "bracket-separator" })).toBe("?value[]=1|2|3");
      expect(stringifyQueryParams({ value: [1, 2, 3] }, { arrayFormat: "comma" })).toBe("?value=1,2,3");
      expect(stringifyQueryParams({ value: [1, 2, 3] }, { arrayFormat: "index" })).toBe(
        "?value[0]=1&value[1]=2&value[2]=3",
      );
      expect(stringifyQueryParams({ value: [1, 2, 3] }, { arrayFormat: "none" })).toBe("?value=1&value=2&value=3");
      expect(stringifyQueryParams({ value: [1, 2, 3] }, { arrayFormat: "separator" })).toBe("?value=1|2|3");
      expect(stringifyQueryParams({ value: [1, 2, 3] }, { arrayFormat: "separator", arraySeparator: "#" })).toBe(
        "?value=1#2#3",
      );
    });
    it("should encode values without strict option", async () => {
      expect(stringifyQueryParams({ value: "![]" }, { encode: true, strict: false })).toBe("?value=!%5B%5D");
      expect(stringifyQueryParams({ value: "![]" }, { encode: false, strict: false })).toBe("?value=![]");
      expect(stringifyQueryParams({ value: "![]" }, { encode: false, strict: true })).toBe("?value=![]");
    });
    it("should add the question mark", async () => {
      expect(stringifyQueryParams("something")).toBe("?something");
      expect(stringifyQueryParams("?something")).toBe("?something");
    });
    it("should return empty string when no query params are passed", async () => {
      expect(stringifyQueryParams("")).toBe("");
      expect(stringifyQueryParams({})).toBe("");
      expect(stringifyQueryParams(null)).toBe("");
      expect(stringifyQueryParams(undefined)).toBe("");
    });
  });

  describe("When using headerMapper", () => {
    it("should assign default headers with headers mapper", async () => {
      const defaultHeaders = { "Content-Type": "application/json" };
      const headers = builder.headerMapper(command);

      expect(headers).toEqual(defaultHeaders);
    });
    it("should assign form data headers", async () => {
      const defaultHeaders = {};
      const data = new FormData();
      const formDataCommand = command.setData(data);
      const headers = builder.headerMapper(formDataCommand);

      expect(headers).toEqual(defaultHeaders);
    });
    it("should not re-assign form data headers", async () => {
      const defaultHeaders = { "Content-Type": "some-custom-format" };
      const formDataCommand = command.setHeaders(defaultHeaders);
      const headers = builder.headerMapper(formDataCommand);

      expect(headers).toEqual(defaultHeaders);
    });
  });

  describe("When using payloadMapper", () => {
    it("should allow to stringify payload", async () => {
      const data = { data: [] };
      const payload = builder.payloadMapper(data);

      expect(payload).toEqual(JSON.stringify(data));
    });
    it("should not stringify FormData payload", async () => {
      const data = new FormData();
      const payload = builder.payloadMapper(data);

      expect(payload).toEqual(data);
    });
    it("should stringify null payload", async () => {
      const data = null;
      const payload = builder.payloadMapper(data);

      expect(payload).toEqual(JSON.stringify(data));
    });
    it("should not stringify undefined payload", async () => {
      const payload = builder.payloadMapper(undefined);

      expect(payload).toBeUndefined();
    });
    it("should not stringify invalid payload", async () => {
      const payload = builder.payloadMapper(() => null);
      expect(payload).toBeUndefined();
    });
  });

  describe("When using stringifyValue util", () => {
    it("should allow to stringify payload", async () => {
      const data = { data: [] };
      const payload = builder.payloadMapper(data);

      expect(payload).toEqual(JSON.stringify(data));
    });
    it("should not stringify FormData payload", async () => {
      const data = new FormData();
      const payload = builder.payloadMapper(data);

      expect(payload).toEqual(data);
    });
    it("should stringify null payload", async () => {
      const data = null;
      const payload = builder.payloadMapper(data);

      expect(payload).toEqual(JSON.stringify(data));
    });
    it("should not stringify undefined payload", async () => {
      const payload = builder.payloadMapper(undefined);

      expect(payload).toBeUndefined();
    });
    it("should not stringify invalid payload", async () => {
      const data: Record<string, unknown> = {};
      data.a = { b: data };

      const payload = builder.payloadMapper(data);
      expect(payload).toBe("");
    });
  });
});

// export const stringifyValue = (response: string | unknown): string => {
//   try {
//     return JSON.stringify(response as string);
//   } catch (err) {
//     return "";
//   }
// };

// // Mappers

// export const getClientHeaders = (command: CommandInstance) => {
//   const isFormData = command.data instanceof FormData;
//   const headers: HeadersInit = {};

//   if (!isFormData) headers["Content-Type"] = "application/json";

//   Object.assign(headers, command.headers);
//   return headers as HeadersInit;
// };

// export const getClientPayload = (data: unknown): string | FormData => {
//   const isFormData = data instanceof FormData;
//   if (!isFormData) return stringifyValue(data);

//   return data;
// };

// // Stringify

// const isValidValue = (options: QueryStringifyOptions) => {
//   return (value: ClientQueryParam) => {
//     const { skipNull, skipEmptyString } = options;

//     if (skipEmptyString && value === undefined) {
//       return false;
//     }
//     if (skipEmptyString && value === "") {
//       return false;
//     }
//     if (skipNull && value === null) {
//       return false;
//     }
//     return true;
//   };
// };

// const encodeValue = (value: string, { encode, strict }: Pick<QueryStringifyOptions, "encode" | "strict">): string => {
//   if (encode && strict) {
//     return encodeURIComponent(value).replace(/[!'()*]/g, (s) => `%${s.charCodeAt(0).toString(16).toUpperCase()}`);
//   }
//   if (encode) {
//     return encodeURIComponent(value);
//   }
//   return value;
// };

// const encodeParams = (key: string, value: ClientQueryParam, options: QueryStringifyOptions) => {
//   const shouldSkip = !isValidValue(options)(value);

//   if (!key || shouldSkip) {
//     return "";
//   }

//   return `${encodeValue(key, options)}=${encodeValue(String(value), options)}`;
// };

// const encodeArray = (key: string, array: Array<ClientQueryParamValues>, options: QueryStringifyOptions): string => {
//   const { arrayFormat, arraySeparator } = options;

//   return array
//     .filter(isValidValue(options))
//     .reduce<string[]>((acc, curr, index) => {
//       const value = curr === null ? "" : curr;

//       switch (arrayFormat) {
//         case "index": {
//           const keyValue = `${encodeValue(key, options)}[${encodeValue(String(index), options)}]=`;
//           acc.push(`${keyValue}${encodeValue(String(value), options)}`);
//           break;
//         }
//         case "bracket": {
//           const keyValue = `${encodeValue(key, options)}[]=`;
//           acc.push(`${keyValue}${encodeValue(String(value), options)}`);
//           break;
//         }
//         case "comma": {
//           const keyValue = (!acc.length && `${encodeValue(key, options)}=`) || "";
//           return [[...acc, `${keyValue}${encodeValue(String(value), options)}`].join(",")];
//         }
//         case "separator": {
//           const keyValue = (!acc.length && `${encodeValue(key, options)}=`) || "";
//           return [[...acc, `${keyValue}${encodeValue(String(value), options)}`].join(arraySeparator || "|")];
//         }
//         case "bracket-separator": {
//           const keyValue = (!acc.length && `${encodeValue(key, options)}[]=`) || "";
//           return [[...acc, `${keyValue}${encodeValue(String(value), options)}`].join(arraySeparator || "|")];
//         }
//         default: {
//           const keyValue = `${encodeValue(key, options)}=`;
//           acc.push(`${keyValue}${encodeValue(String(value), options)}`);
//         }
//       }

//       return acc;
//     }, [])
//     .join("&");
// };

// export const stringifyQueryParams = (
//   queryParams: ClientQueryParamsType | string | NegativeTypes,
//   options: QueryStringifyOptions = stringifyDefaultOptions,
// ): string => {
//   if (!queryParams || !Object.keys(queryParams)?.length) {
//     return "";
//   }

//   if (typeof queryParams === "string") {
//     const hasQuestionMark = queryParams[0] === "?";
//     return hasQuestionMark ? queryParams : `?${queryParams}`;
//   }

//   const stringified = Object.entries(queryParams)
//     .map(([key, value]): string => {
//       if (Array.isArray(value)) {
//         return encodeArray(key, value, options);
//       }

//       return encodeParams(key, value, options);
//     })
//     .filter(Boolean)
//     .join("&");

//   if (stringified) {
//     return `?${stringified}`;
//   }
//   return "";
// };
