import { Client } from "@hyper-fetch/core";

import { GraphqlMethod, getRequestValues, GraphqlAdapter } from "adapter";
import { gqlEndpointNameMapper } from "../../../src/adapter/adapter.utils";
import { getUserQuery, getUserQueryString } from "../../constants/queries.constants";

describe("Graphql Adapter [ Utils ]", () => {
  let client = new Client({ url: "https://shared-base-url/graphql" }).setAdapter(GraphqlAdapter());
  let request = client.createRequest<{ response: any; payload: any }>()({
    endpoint: getUserQuery,
    method: GraphqlMethod.POST,
  });
  let requestGet = client.createRequest<{ response: any; payload: any }>()({
    endpoint: getUserQueryString,
    method: GraphqlMethod.GET,
  });

  beforeEach(() => {
    client = new Client({ url: "https://shared-base-url/graphql" }).setAdapter(GraphqlAdapter());
    request = client.createRequest<{ response: any; payload: any }>()({
      endpoint: getUserQuery,
      method: GraphqlMethod.POST,
    });
    requestGet = client.createRequest<{ response: any; payload: any }>()({
      endpoint: getUserQueryString,
      method: GraphqlMethod.GET,
    });

    vi.resetAllMocks();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe("When using getRequestValues", () => {
    it("should generate values", async () => {
      const { fullUrl, payload } = getRequestValues(request);

      expect(fullUrl).toBe("https://shared-base-url/graphql");
      expect(payload).toBe('{"query":"query GetUser {\\n  username {\\n    username\\n    firstName\\n  }\\n}"}');
      expect(request.method).toBe("POST");
      expect(request.endpoint).toBeString();
    });
    it("should generate values for GET", async () => {
      const { fullUrl, payload } = getRequestValues(requestGet);

      expect(fullUrl).toBe(
        "https://shared-base-url/graphql?query=%0Aquery%20GetUser%20%7B%0A%20%20username%20%7B%0A%20%20%20%20username%0A%20%20%20%20firstName%0A%20%20%7D%0A%7D%0A",
      );
      expect(payload).toBeNull();
      expect(requestGet.method).toBe("GET");
      expect(requestGet.endpoint).toBeString();
    });
  });

  describe("When using gqlEndpointNameMapper", () => {
    it("should return operation name for a named query", () => {
      const result = gqlEndpointNameMapper("query GetUser { username { username firstName } }");
      expect(result).toBe("GetUser");
    });

    it("should return field name when operation has no name", () => {
      const result = gqlEndpointNameMapper("query { username { username firstName } }");
      expect(result).toBe("username");
    });

    it("should fallback when operation has no name and selection is not a Field", () => {
      const result = gqlEndpointNameMapper("query { ... on User { username } }");
      expect(result).toBe("User");
    });

    it("should return 'graphql-request' when endpoint is empty after cleanup", () => {
      const result = gqlEndpointNameMapper("{}");
      expect(result).toBe("graphql-request");
    });

    it("should use fallback when parse throws (invalid graphql)", () => {
      const result = gqlEndpointNameMapper("not a valid graphql string at all");
      expect(result).toBe("not");
    });

    it("should return 'graphql-request' when entire fallback string is empty", () => {
      const result = gqlEndpointNameMapper("query");
      expect(result).toBe("graphql-request");
    });
  });
});
