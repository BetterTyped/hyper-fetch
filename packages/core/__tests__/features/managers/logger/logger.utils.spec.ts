import { createClient } from "client";
import { getTime, logger } from "managers";

describe("Logger [ Utils ]", () => {
  const logSpy = jest.spyOn(console, "log");
  const groupCollapsedSpy = jest.spyOn(console, "groupCollapsed");
  const groupEndSpy = jest.spyOn(console, "groupEnd");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Given using logger utils", () => {
    describe("When getTime util gets triggered", () => {
      it("should allow to format data string", () => {
        const time = getTime();
        expect(time).toBeString();
      });
    });
    describe("When logger util gets triggered", () => {
      it("should allow to log message without extra data", () => {
        logger({
          module: "Test",
          type: "system",
          level: "debug",
          title: "Test",
          extra: {},
        });
        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(groupCollapsedSpy).not.toHaveBeenCalled();
        expect(groupEndSpy).not.toHaveBeenCalled();
      });
      it("should allow to log message with extra data", () => {
        const extra = { data: [{ test: 1 }] };

        logger({
          module: "Test",
          type: "system",
          level: "debug",
          title: "Test",
          extra,
        });
        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(groupCollapsedSpy).toHaveBeenCalledTimes(1);
        expect(groupEndSpy).toHaveBeenCalledTimes(1);
      });
      it("should handle request type logging correctly", () => {
        const extra = {
          request: createClient({ url: "https://test.com" }).createRequest()({ endpoint: "/api/test" }),
          response: { data: "test" } as any,
          requestId: "123",
        };

        logger({
          module: "Test",
          type: "request",
          level: "debug",
          title: "Test Request",
          extra,
        });

        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(groupCollapsedSpy).toHaveBeenCalledTimes(1);
        expect(groupEndSpy).toHaveBeenCalledTimes(1);
      });
      it("should handle response type logging correctly", () => {
        const extra = {
          request: createClient({ url: "https://test.com" }).createRequest()({ endpoint: "/api/test" }),
          response: { data: "test" } as any,
          requestId: "123",
        };

        logger({
          module: "Test",
          type: "response",
          level: "debug",
          title: "Test Response",
          extra,
        });

        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(groupCollapsedSpy).toHaveBeenCalledTimes(1);
        expect(groupEndSpy).toHaveBeenCalledTimes(1);
      });
      it("should handle no extra data", () => {
        logger({
          module: "Test",
          type: "system",
          level: "debug",
          title: "Test Response",
          extra: undefined as any,
        });

        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(groupCollapsedSpy).toHaveBeenCalledTimes(0);
        expect(groupEndSpy).toHaveBeenCalledTimes(0);
      });
    });
  });
});
