import { Client } from "@hyper-fetch/core";

import { GraphQlMethod, getRequestValues, graphqlAdapter } from "adapter";
import { getUserQuery, getUserQueryString } from "../../constants/queries.constants";
import { resetInterceptors, startServer, stopServer } from "../../server";

describe("Graphql Adapter [ Utils ]", () => {
  let client = new Client({ url: "https://shared-base-url/graphql" }).setAdapter(graphqlAdapter);
  let request = client.createRequest<{ response: any; payload: any }>()({
    endpoint: getUserQuery,
    method: GraphQlMethod.POST,
  });
  let requestGet = client.createRequest<{ response: any; payload: any }>()({
    endpoint: getUserQueryString,
    method: GraphQlMethod.GET,
  });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "https://shared-base-url/graphql" }).setAdapter(graphqlAdapter);
    request = client.createRequest<{ response: any; payload: any }>()({
      endpoint: getUserQuery,
      method: GraphQlMethod.POST,
    });
    requestGet = client.createRequest<{ response: any; payload: any }>()({
      endpoint: getUserQueryString,
      method: GraphQlMethod.GET,
    });

    resetInterceptors();
    jest.resetAllMocks();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using 'getRequestValues'", () => {
    it("should generate values", async () => {
      const { fullUrl, payload, method } = getRequestValues(request);

      expect(fullUrl).toBe("https://shared-base-url/graphql");
      expect(payload).toBe('{"query":"query GetUser {\\n  username {\\n    username\\n    firstName\\n  }\\n}"}');
      expect(method).toBe("POST");
      expect(request.endpoint).toBeString();
    });
    it("should generate values for GET", async () => {
      const { fullUrl, payload, method } = getRequestValues(requestGet);

      expect(fullUrl).toBe(
        "https://shared-base-url/graphql?query=%0Aquery%20GetUser%20%7B%0A%20%20username%20%7B%0A%20%20%20%20username%0A%20%20%20%20firstName%0A%20%20%7D%0A%7D%0A",
      );
      expect(payload).toBeNull();
      expect(method).toBe("GET");
      expect(requestGet.endpoint).toBeString();
    });
  });
});
