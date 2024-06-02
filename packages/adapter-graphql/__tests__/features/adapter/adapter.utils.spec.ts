import { Client } from "@hyper-fetch/core";

import { GraphqlMethod, getRequestValues, GraphqlAdapter } from "adapter";
import { getUserQuery, getUserQueryString } from "../../constants/queries.constants";

describe("Graphql Adapter [ Utils ]", () => {
  let client = new Client({ url: "https://shared-base-url/graphql" }).setAdapter(GraphqlAdapter);
  let request = client.createRequest<any, any>()({ endpoint: getUserQuery, method: GraphqlMethod.POST });
  let requestGet = client.createRequest<any, any>()({ endpoint: getUserQueryString, method: GraphqlMethod.GET });

  beforeEach(() => {
    client = new Client({ url: "https://shared-base-url/graphql" }).setAdapter(GraphqlAdapter);
    request = client.createRequest<any, any>()({ endpoint: getUserQuery, method: GraphqlMethod.POST });
    requestGet = client.createRequest<any, any>()({ endpoint: getUserQueryString, method: GraphqlMethod.GET });

    jest.resetAllMocks();
    jest.clearAllMocks();
    jest.restoreAllMocks();
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
