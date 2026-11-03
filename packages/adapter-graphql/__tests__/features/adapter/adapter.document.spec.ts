import { Client, stringifyDefaultOptions } from "@hyper-fetch/core";
import { GraphqlAdapter, GraphqlMethod, getGqlDocument, getRequestValues, gqlEndpointNameMapper } from "adapter";
import gql from "graphql-tag";

import { getUserQuery, getUserQueryString } from "../../constants/queries.constants";

const url = "https://shared-base-url/graphql";
const printedQuery = "query GetUser {\n  username {\n    username\n    firstName\n  }\n}";

const getQueryString = (fullUrl: string) => new URL(fullUrl).searchParams;

describe("Graphql Adapter [ Document and query params ]", () => {
  const createClient = () => new Client({ url }).setAdapter(GraphqlAdapter());

  let client = createClient();

  beforeEach(() => {
    client = createClient();
  });

  describe("When document is omitted", () => {
    it("should keep the endpoint as the document and the client url as the url", () => {
      const request = client.createRequest()({ endpoint: getUserQuery });

      const { fullUrl, payload } = getRequestValues(request);

      expect(fullUrl).toBe(url);
      expect(payload).toBe(JSON.stringify({ query: printedQuery }));
      expect(getGqlDocument(request)).toBe(printedQuery);
    });

    it("should keep the same keys as before", () => {
      const request = client.createRequest()({ endpoint: getUserQueryString });

      expect(request.cacheKey).toBe("POST_GetUser--");
      expect(request.queryKey).toBe("POST_GetUser--");
      expect(request.abortKey).toBe("POST_GetUser-false");
    });

    it("should append query params to the POST url", () => {
      const request = client
        .createRequest<{ queryParams: { source: string } }>()({ endpoint: getUserQuery })
        .setQueryParams({ source: "app" });

      const { fullUrl, payload } = getRequestValues(request);

      expect(fullUrl).toBe(`${url}?source=app`);
      expect(payload).toBe(JSON.stringify({ query: printedQuery }));
    });

    it("should merge query params into the GET query string", () => {
      const request = client
        .createRequest<{ queryParams: { source: string } }>()({ endpoint: getUserQuery, method: GraphqlMethod.GET })
        .setQueryParams({ source: "app" });

      const { fullUrl, payload } = getRequestValues(request);

      expect(fullUrl.startsWith(`${url}?query=`)).toBeTrue();
      expect(getQueryString(fullUrl).get("query")).toBe(printedQuery);
      expect(getQueryString(fullUrl).get("source")).toBe("app");
      expect(payload).toBeNull();
    });
  });

  describe("When document is set", () => {
    it("should use the endpoint as the url path and print the DocumentNode as query", () => {
      const request = client.createRequest()({ endpoint: "/User", document: getUserQuery });

      const { fullUrl, payload } = getRequestValues(request);

      expect(fullUrl).toBe(`${url}/User`);
      expect(payload).toBe(JSON.stringify({ query: printedQuery }));
      expect(request.endpoint).toBe("/User");
      expect(getGqlDocument(request)).toBe(getUserQuery);
    });

    it("should send a string document as it is", () => {
      const request = client.createRequest()({ endpoint: "/User", document: getUserQueryString });

      expect(getRequestValues(request).payload).toBe(JSON.stringify({ query: getUserQueryString }));
    });

    it("should build the url from the issue example", () => {
      const request = client
        .createRequest<{ payload: { id: number } }>()({ endpoint: "/User", document: getUserQuery })
        .setQueryParams({ source: "app", build: "1.2.3" })
        .setPayload({ id: 1 });

      const { fullUrl, payload } = getRequestValues(request);

      expect(fullUrl).toBe(`${url}/User?source=app&build=1.2.3`);
      expect(payload).toBe(JSON.stringify({ query: printedQuery, variables: { id: 1 } }));
    });

    it("should send everything in the query string for GET", () => {
      const request = client
        .createRequest<{ payload: { id: number } }>()({
          endpoint: "/User",
          document: getUserQuery,
          method: GraphqlMethod.GET,
        })
        .setQueryParams({ source: "app" })
        .setPayload({ id: 1 });

      const { fullUrl, payload } = getRequestValues(request);
      const searchParams = getQueryString(fullUrl);

      expect(fullUrl.startsWith(`${url}/User?query=`)).toBeTrue();
      expect(searchParams.get("query")).toBe(printedQuery);
      expect(searchParams.get("variables")).toBe(JSON.stringify({ id: 1 }));
      expect(searchParams.get("source")).toBe("app");
      expect(payload).toBeNull();
    });

    it("should allow for an empty path", () => {
      const request = client
        .createRequest()({ endpoint: "", document: getUserQuery })
        .setQueryParams({ source: "app" });

      expect(getRequestValues(request).fullUrl).toBe(`${url}?source=app`);
    });

    it("should replace params in the url path", () => {
      const request = client.createRequest()({ endpoint: "/tenant/:tenantId/User", document: getUserQuery });

      const { fullUrl, payload } = getRequestValues(request.setParams({ tenantId: 7 }));

      expect(fullUrl).toBe(`${url}/tenant/7/User`);
      expect(payload).toBe(JSON.stringify({ query: printedQuery }));
    });

    it("should treat nullish document as omitted", () => {
      const request = client.createRequest()({ endpoint: getUserQueryString, document: undefined });

      expect(getRequestValues(request).fullUrl).toBe(url);
      expect(getGqlDocument(request)).toBe(getUserQueryString);
    });

    it("should keep the document on clones", () => {
      const request = client.createRequest()({ endpoint: "/User", document: getUserQuery });

      const cloned = request.setHeaders({ a: "b" }).setRetry(1).clone();

      expect(getRequestValues(cloned).fullUrl).toBe(`${url}/User`);
      expect(getGqlDocument(cloned)).toBe(getUserQuery);
    });

    it("should survive JSON serialization", () => {
      const request = client.createRequest()({ endpoint: "/User", document: getUserQuery });

      const restored = JSON.parse(JSON.stringify(request.toJSON()));
      const hydrated = client.fromJSON(restored);

      expect(getRequestValues(hydrated as any).fullUrl).toBe(`${url}/User`);
      expect(getRequestValues(hydrated as any).payload).toBe(JSON.stringify({ query: printedQuery }));
      expect(hydrated.cacheKey).toBe(request.cacheKey);
    });
  });

  describe("When mapping query params", () => {
    const getUrl = (queryParams: any, method = GraphqlMethod.POST) => {
      const request = client.createRequest<{ queryParams: any }>()({ endpoint: "/User", document: "{ a }", method });
      return getRequestValues(request.setQueryParams(queryParams)).fullUrl;
    };

    it("should not add a question mark without query params", () => {
      expect(getUrl(undefined)).toBe(`${url}/User`);
      expect(getUrl(null)).toBe(`${url}/User`);
      expect(getUrl({})).toBe(`${url}/User`);
      expect(getUrl("")).toBe(`${url}/User`);
      expect(getUrl("?")).toBe(`${url}/User`);
    });

    it("should accept string query params with and without the question mark", () => {
      expect(getUrl("a=1&b=2")).toBe(`${url}/User?a=1&b=2`);
      expect(getUrl("?a=1&b=2")).toBe(`${url}/User?a=1&b=2`);
    });

    it("should encode values and skip the empty ones", () => {
      expect(getUrl({ a: "x y", b: undefined, c: null, d: [1, 2] })).toBe(`${url}/User?a=x%20y&d[]=1&d[]=2`);
    });

    it("should leave query and variables keys alone for POST", () => {
      expect(getUrl({ query: "mine", variables: "mine" })).toBe(`${url}/User?query=mine&variables=mine`);
    });

    it.each([
      ["object", { query: "mine", variables: "mine", source: "app" }],
      ["string", "query=mine&variables=mine&source=app"],
      ["string with question mark", "?variables=mine&query=mine&source=app"],
      ["encoded keys", "%71uery=mine&source=app"],
      ["array", { query: ["mine", "mine2"], source: "app" }],
      ["bracket array", "query[]=mine&query%5B%5D=mine2&variables[0]=mine&source=app"],
    ])("should prefer query and variables on GET collision for %s", (_, queryParams) => {
      const request = client
        .createRequest<{ queryParams: any; payload: any }>()({
          endpoint: "/User",
          document: "{ a }",
          method: GraphqlMethod.GET,
        })
        .setQueryParams(queryParams)
        .setPayload({ id: 1 });

      const searchParams = getQueryString(getRequestValues(request).fullUrl);

      expect(searchParams.getAll("query")).toStrictEqual(["{ a }"]);
      expect(searchParams.getAll("variables")).toStrictEqual([JSON.stringify({ id: 1 })]);
      expect(searchParams.get("source")).toBe("app");
      expect([...searchParams.keys()]).toStrictEqual(["query", "variables", "source"]);
    });

    it("should not fail on malformed keys", () => {
      expect(getUrl("%ZZ=1&a=2", GraphqlMethod.GET)).toEndWith("&%ZZ=1&a=2");
    });

    it("should keep similarly named keys on GET", () => {
      const searchParams = getQueryString(getUrl({ queryId: 1, "variables.a": 2 }, GraphqlMethod.GET));

      expect(searchParams.get("queryId")).toBe("1");
      expect(searchParams.get("variables.a")).toBe("2");
    });

    it("should use the custom query params mapper", () => {
      const mapper = vi.fn((queryParams: any) => `custom=${queryParams.a}`);
      const customClient = new Client({ url }).setAdapter(GraphqlAdapter().setQueryParamsMapper(mapper));
      const request = customClient
        .createRequest<{ queryParams: { a: number } }>()({ endpoint: "/User", document: "{ a }" })
        .setQueryParams({ a: 1 });

      expect(getRequestValues(request).fullUrl).toBe(`${url}/User?custom=1`);
      expect(mapper).toHaveBeenCalledWith({ a: 1 }, undefined);
    });

    it("should accept the object returned from the custom mapper", () => {
      const customClient = new Client({ url }).setAdapter(
        GraphqlAdapter().setQueryParamsMapper((queryParams) => ({ ...(queryParams as any), mapped: true })),
      );
      const request = customClient
        .createRequest<{ queryParams: { a: number } }>()({ endpoint: "/User", document: "{ a }" })
        .setQueryParams({ a: 1 });

      expect(getRequestValues(request).fullUrl).toBe(`${url}/User?a=1&mapped=true`);
    });

    it("should use the query params mapper config", () => {
      const customClient = new Client({ url }).setAdapter(
        GraphqlAdapter().setQueryParamsMapperConfig({ arrayFormat: "bracket" }),
      );
      const request = customClient
        .createRequest<{ queryParams: { a: number[] } }>()({ endpoint: "/User", document: "{ a }" })
        .setQueryParams({ a: [1, 2] });

      expect(getRequestValues(request).fullUrl).toBe(`${url}/User?a[]=1&a[]=2`);
    });

    it("should keep the encoding with the default options spread into the config", () => {
      const customClient = new Client({ url }).setAdapter(
        GraphqlAdapter().setQueryParamsMapperConfig({ ...stringifyDefaultOptions, arrayFormat: "comma" }),
      );
      const request = customClient
        .createRequest<{ queryParams: { a: string[] } }>()({ endpoint: "/User", document: "{ a }" })
        .setQueryParams({ a: ["x y", "z"] });

      expect(getRequestValues(request).fullUrl).toBe(`${url}/User?a=x%20y,z`);
    });

    it("should prefer already mapped query params passed by the fetcher", () => {
      const mapper = vi.fn(() => "from=mapper");
      const customClient = new Client({ url }).setAdapter(GraphqlAdapter().setQueryParamsMapper(mapper));
      const request = customClient.createRequest()({ endpoint: "/User", document: "{ a }" });

      expect(getRequestValues(request, "from=bindings").fullUrl).toBe(`${url}/User?from=bindings`);
      expect(mapper).not.toHaveBeenCalled();
    });
  });

  describe("When generating keys", () => {
    it("should read the operation name from the document", () => {
      const fromNode = client.createRequest()({ endpoint: "/User", document: getUserQuery });
      const fromString = client.createRequest()({ endpoint: "/User", document: getUserQueryString });

      [fromNode, fromString].forEach((request) => {
        expect(request.cacheKey).toBe("POST_GetUser/User--");
        expect(request.queryKey).toBe("POST_GetUser/User--");
        expect(request.abortKey).toBe("POST_GetUser/User-false");
      });
    });

    it("should not add the path for the empty endpoint", () => {
      const request = client.createRequest()({ endpoint: "", document: getUserQuery });

      expect(request.cacheKey).toBe("POST_GetUser--");
    });

    it("should distinguish the same operation sent to different paths", () => {
      const v1 = client.createRequest()({ endpoint: "/v1/User", document: getUserQuery });
      const v2 = client.createRequest()({ endpoint: "/v2/User", document: getUserQuery });

      expect(v1.cacheKey).not.toBe(v2.cacheKey);
      expect(v1.queryKey).not.toBe(v2.queryKey);
      expect(v1.abortKey).not.toBe(v2.abortKey);
    });

    it("should distinguish different operations sent to the same path", () => {
      const first = client.createRequest()({ endpoint: "/graphql", document: "query First { a }" });
      const second = client.createRequest()({ endpoint: "/graphql", document: "query Second { a }" });

      expect(first.cacheKey).not.toBe(second.cacheKey);
    });

    it("should include query params and params in the cache and query keys", () => {
      const request = client.createRequest()({ endpoint: "/tenant/:id/User", document: getUserQuery });

      const withQuery = request.setQueryParams({ a: 1 });
      const withParams = request.setParams({ id: 2 });

      expect(withQuery.cacheKey).not.toBe(request.cacheKey);
      expect(withQuery.queryKey).not.toBe(request.queryKey);
      expect(withParams.cacheKey).not.toBe(request.cacheKey);
      expect(withParams.queryKey).not.toBe(request.queryKey);
      // Every value of the params shares one abort group, same as in the HttpAdapter
      expect(withParams.abortKey).toBe(request.abortKey);
    });

    it("should keep the explicit keys", () => {
      const request = client.createRequest()({ endpoint: "/User", document: getUserQuery, cacheKey: "mine" });

      expect(request.cacheKey).toBe("mine");
    });
  });

  describe("When using gqlEndpointNameMapper", () => {
    it("should read the name from a DocumentNode", () => {
      expect(gqlEndpointNameMapper(getUserQuery)).toBe("GetUser");
    });

    it("should read the first field from an anonymous DocumentNode", () => {
      expect(
        gqlEndpointNameMapper(
          gql`
            {
              username {
                id
              }
            }
          `,
        ),
      ).toBe("username");
    });

    it("should use the fallback for a DocumentNode without operation", () => {
      expect(
        gqlEndpointNameMapper(
          gql`
            fragment A on User {
              id
            }
          `,
        ),
      ).toBe("graphql-request");
    });

    it("should use the name of the mutation", () => {
      expect(gqlEndpointNameMapper("mutation Login($a: String!) { login(a: $a) { id } }")).toBe("Login");
    });
  });

  describe("When using the devtools endpoint getter", () => {
    const getter = () => client.adapter.unstable_devtoolsEndpointGetter;

    it("should read the operation name from the endpoint", () => {
      expect(getter()(getUserQueryString)).toBe("GetUser");
      expect(getter()(getUserQueryString, { endpoint: getUserQueryString })).toBe("GetUser");
    });

    it("should read the operation name from the document", () => {
      const request = client.createRequest()({ endpoint: "/User", document: getUserQuery });

      expect(getter()("/User", request.requestOptions)).toBe("GetUser");
      expect(getter()("/User", { document: getUserQueryString })).toBe("GetUser");
    });
  });
});
