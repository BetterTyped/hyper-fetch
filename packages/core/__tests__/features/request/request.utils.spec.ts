import { Client } from "client";
import { getRequestDispatcher, getRequestKey, getProgressData, stringifyKey } from "request";

describe("Request [ Utils ]", () => {
  describe("when stringifyKey function is used", () => {
    it("should stringify valid values", async () => {
      const response = { something: 123 };
      const someString = "123";
      expect(stringifyKey(response)).toBe(JSON.stringify(response));
      expect(stringifyKey(someString)).toBe(someString);
      expect(stringifyKey(undefined)).toBe("");
      expect(stringifyKey(null)).toBe("");
    });

    it("should not stringify invalid values", async () => {
      expect(stringifyKey(() => null)).toBe("");
    });
  });
  describe("when getProgressData function is used", () => {
    it("should process valid values on NaN progress values", async () => {
      const date = new Date();
      const response = getProgressData(date, date, { total: NaN, loaded: NaN });
      expect(response).toStrictEqual({
        progress: 0,
        timeLeft: 0,
        sizeLeft: 0,
        total: 0,
        loaded: 0,
        startTimestamp: +date,
      });
    });
  });
  describe("when getRequestKey function is used", () => {
    it("should return exact endpoint key", async () => {
      const client = new Client({ url: "shared-base-url" });
      const request = client
        .createRequest()({ endpoint: "/users/:userId" })
        .setParams({ userId: 1 })
        .setQueryParams("?test=1");
      expect(getRequestKey(request)).toBe("GET_/users/1?test=1");
    });
    it("should useInitialValues and return generic endpoint key", async () => {
      const client = new Client({ url: "shared-base-url" });
      const request = client
        .createRequest()({ endpoint: "/users/:userId" })
        .setParams({ userId: 1 })
        .setQueryParams("?test=1");
      expect(getRequestKey(request, true)).toBe("GET_/users/:userId");
    });
  });
  describe("when getRequestDispatcher function is used", () => {
    it("should give proper auto dispatcher", async () => {
      const client = new Client({ url: "shared-base-url" });
      const fetchRequest = client.createRequest()({ endpoint: "/users/:userId" });
      const submitRequest = client.createRequest()({ endpoint: "/users/:userId", method: "POST" });

      const valueFetch = getRequestDispatcher(fetchRequest, "auto");
      const valueSubmit = getRequestDispatcher(submitRequest, "auto");
      expect(valueFetch[0]).toBe(client.fetchDispatcher);
      expect(valueSubmit[0]).toBe(client.submitDispatcher);
      expect(valueFetch[1]).toBe(true);
      expect(valueSubmit[1]).toBe(false);
    });
    it("should give selected dispatcher", async () => {
      const client = new Client({ url: "shared-base-url" });
      const fetchRequest = client.createRequest()({ endpoint: "/users/:userId" });
      const submitRequest = client.createRequest()({ endpoint: "/users/:userId", method: "POST" });

      const valueFetch = getRequestDispatcher(fetchRequest, "submit");
      const valueSubmit = getRequestDispatcher(submitRequest, "fetch");
      expect(valueSubmit[0]).toBe(client.fetchDispatcher);
      expect(valueFetch[0]).toBe(client.submitDispatcher);
      expect(valueSubmit[1]).toBe(true);
      expect(valueFetch[1]).toBe(false);
    });
  });
});
