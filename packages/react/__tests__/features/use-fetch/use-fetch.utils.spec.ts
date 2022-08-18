import { getRefreshTime } from "use-fetch";

describe("useFetch [ Utils ]", () => {
  const refreshTime = 1000;
  describe("given using getRefreshTime util", () => {
    describe("when state is available", () => {
      it("should give the reduced refresh time based on timestamp", async () => {
        const timestamp = new Date(+new Date() - 500);
        const time = getRefreshTime(refreshTime, timestamp);
        expect(time).toBeLessThanOrEqual(500);
        expect(time).toBeGreaterThanOrEqual(490);
      });
      it("should give refreshTime on old timestamp", async () => {
        const timestamp = new Date(+new Date() - refreshTime);
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
