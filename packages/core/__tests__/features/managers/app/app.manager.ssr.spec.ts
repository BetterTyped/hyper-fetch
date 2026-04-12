/**
 * @vitest-environment jsdom
 */
import { hasDocument, hasWindow } from "managers";

describe("AppManager [ SSR ]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("Given window is not available from beginning", () => {
    describe("When app manager is initialized", () => {
      it("should not throw without document", async () => {
        vi.spyOn(window, "document", "get").mockImplementation(() => {
          throw new Error();
        });

        expect(hasDocument).not.toThrow();
        expect(hasDocument()).toBeFalse();
      });
      it("should not throw without window", async () => {
        vi.spyOn(global, "window", "get").mockImplementation(() => {
          throw new Error();
        });

        expect(hasWindow).not.toThrow();
        expect(hasWindow()).toBeFalse();
      });
      it("should initialize and await for window to attach events", async () => {
        // Todo
      });
      it("should emit events after hydration", async () => {
        // Todo
      });
      it("should await to set initial isOnline value", async () => {
        // Todo
      });
      it("should await to set initial isFocused value", async () => {
        // Todo
      });
    });
  });
});
