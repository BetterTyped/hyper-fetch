import { getRefreshTime } from "hooks/use-fetch";

describe("useFetch [ Utils ]", () => {
  const refreshTime = 1000;

  // getRefreshTime reads Date.now(), so freeze it to make the elapsed time exact
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("given using getRefreshTime util", () => {
    describe("when state is available", () => {
      it("should give the reduced refresh time based on timestamp", async () => {
        const timestamp = new Date(Date.now() - 500);
        const time = getRefreshTime(refreshTime, timestamp);
        expect(time).toBe(500);
      });
      it("should give refreshTime on old timestamp", async () => {
        const timestamp = new Date(Date.now() - refreshTime);
        const time = getRefreshTime(refreshTime, timestamp);
        expect(time).toBe(refreshTime);
      });
    });
    describe("when only refreshTime gets provided", () => {
      it("should give refreshTime", async () => {
        const time = getRefreshTime(refreshTime);
        expect(time).toBe(refreshTime);
      });
    });
  });
});
