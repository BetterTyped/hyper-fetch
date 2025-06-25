import { getSocketError } from "utils";

describe("Adapter [ Error ]", () => {
  describe("WebSocket close codes", () => {
    it("should handle normal closure (1000)", () => {
      const event = new CloseEvent("close", { code: 1000 });
      expect(getSocketError(event)).toBe(
        "Normal closure, meaning that the purpose for which the connection was established has been fulfilled.",
      );
    });

    it("should handle going away (1001)", () => {
      const event = new CloseEvent("close", { code: 1001 });
      expect(getSocketError(event)).toBe(
        'An endpoint is "going away", such as a server going down or a browser having navigated away from a page.',
      );
    });

    it("should handle protocol error (1002)", () => {
      const event = new CloseEvent("close", { code: 1002 });
      expect(getSocketError(event)).toBe("An endpoint is terminating the connection due to a protocol error");
    });

    it("should handle unsupported data (1003)", () => {
      const event = new CloseEvent("close", { code: 1003 });
      expect(getSocketError(event)).toBe(
        "An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).",
      );
    });

    it("should handle reserved code (1004)", () => {
      const event = new CloseEvent("close", { code: 1004 });
      expect(getSocketError(event)).toBe("Reserved. The specific meaning might be defined in the future.");
    });

    it("should handle no status code (1005)", () => {
      const event = new CloseEvent("close", { code: 1005 });
      expect(getSocketError(event)).toBe("No status code was actually present.");
    });

    it("should handle abnormal closure (1006)", () => {
      const event = new CloseEvent("close", { code: 1006 });
      expect(getSocketError(event)).toBe(
        "The connection was closed abnormally, e.g., without sending or receiving a Close control frame",
      );
    });

    it("should handle invalid frame payload data (1007)", () => {
      const event = new CloseEvent("close", { code: 1007 });
      expect(getSocketError(event)).toBe(
        "An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [https://www.rfc-editor.org/rfc/rfc3629] data within a text message).",
      );
    });

    it("should handle policy violation (1008)", () => {
      const event = new CloseEvent("close", { code: 1008 });
      expect(getSocketError(event)).toBe(
        'An endpoint is terminating the connection because it has received a message that "violates its policy". This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.',
      );
    });

    it("should handle message too big (1009)", () => {
      const event = new CloseEvent("close", { code: 1009 });
      expect(getSocketError(event)).toBe(
        "An endpoint is terminating the connection because it has received a message that is too big for it to process.",
      );
    });

    it("should handle missing extension (1010)", () => {
      const event = new CloseEvent("close", { code: 1010, reason: "compression" });
      expect(getSocketError(event)).toBe(
        "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: compression",
      );
    });

    it("should handle missing extension with unknown reason (1010)", () => {
      const event = new CloseEvent("close", { code: 1010 });
      expect(getSocketError(event)).toBe(
        "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: Unknown reason",
      );
      const event2 = new CloseEvent("close", { code: 1010, reason: "Some reason" });
      expect(getSocketError(event2)).toBe(
        "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: Some reason",
      );
      const event3 = new Event("close");
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      event3.code = 1010;
      expect(getSocketError(event3)).toBe(
        "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: Unknown reason",
      );
    });

    it("should handle internal error (1011)", () => {
      const event = new CloseEvent("close", { code: 1011 });
      expect(getSocketError(event)).toBe(
        "A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.",
      );
    });

    it("should handle TLS handshake failure (1015)", () => {
      const event = new CloseEvent("close", { code: 1015 });
      expect(getSocketError(event)).toBe(
        "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).",
      );
    });

    it("should handle unknown close codes", () => {
      const event = new CloseEvent("close", { code: 9999 });
      expect(getSocketError(event)).toBe("Unknown reason");
    });
  });

  describe("MessageEvent handling", () => {
    it("should handle MessageEvent with data", () => {
      const event = new MessageEvent("message", { data: { error: "test error" } });
      expect(getSocketError(event)).toBe('{"error":"test error"}');
    });
  });

  describe("Generic Event handling", () => {
    it("should handle generic events", () => {
      const event = new Event("error");
      expect(getSocketError(event)).toBe("There was an socket error");
    });
  });
});
