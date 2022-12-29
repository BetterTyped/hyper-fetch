import { act } from "@testing-library/react";

import { startServer, resetInterceptors, stopServer } from "../../server";
import { client, renderUseAppManager } from "../../utils";

describe("useAppManager [ Base ]", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    jest.resetModules();
    client.clear();
  });

  describe("given app is initializing", () => {
    describe("when hook gets rendered", () => {
      it("should initialize in online mode", async () => {
        const { result } = renderUseAppManager(client);
        expect(result.current.isOnline).toBeTrue();
      });

      it("should initialize in focused mode", async () => {
        const { result } = renderUseAppManager(client);
        expect(result.current.isFocused).toBeTrue();
      });
    });
  });
  describe("given app online status change", () => {
    describe("when turning offline", () => {
      it("should change isOnline state to false", async () => {
        const { result } = renderUseAppManager(client);

        act(() => {
          result.current.setOnline(false);
        });
        expect(result.current.isOnline).toBeFalse();
      });
    });
    describe("when turning online", () => {
      it("should change isOnline state to true", async () => {
        const { result } = renderUseAppManager(client);

        act(() => {
          result.current.setOnline(false);
          result.current.setOnline(true);
        });
        expect(result.current.isOnline).toBeTrue();
      });
    });
  });
  describe("given app focus status change", () => {
    describe("when turning blur", () => {
      it("should change isFocused state to false", async () => {
        const { result } = renderUseAppManager(client);

        act(() => {
          result.current.setFocused(false);
        });
        expect(result.current.isFocused).toBeFalse();
      });
    });
    describe("when turning focused", () => {
      it("should change isFocused state to true", async () => {
        const { result } = renderUseAppManager(client);

        act(() => {
          result.current.setFocused(false);
          result.current.setFocused(true);
        });
        expect(result.current.isFocused).toBeTrue();
      });
    });
  });
});
