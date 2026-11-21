import { getAdapterBindings } from "adapter";
import { Client } from "client";

/**
 * Progress events must report every new state of a transfer, whatever its size. They used to stop for good once an
 * event with a total of exactly 100 bytes was emitted: the guard compared the size in bytes with 100.
 */
describe("Adapter [ Bindings progress ]", () => {
  const requestId = "progress-test";

  const setup = async () => {
    const client = new Client({ url: "http://localhost:9000" });
    const request = client.createRequest<{ response: string; payload: string }>()({ endpoint: "/progress" });
    const bindings = await getAdapterBindings({
      request,
      requestId,
      resolve: () => null,
      onStartTime: () => null,
      internalErrorMapping: (error) => error,
    });
    const downloads: { loaded: number; total: number; progress: number }[] = [];
    const uploads: { loaded: number; total: number; progress: number }[] = [];
    client.requestManager.events.onDownloadProgressById(requestId, ({ loaded, total, progress }) => {
      downloads.push({ loaded, total, progress });
    });
    client.requestManager.events.onUploadProgressById(requestId, ({ loaded, total, progress }) => {
      uploads.push({ loaded, total, progress });
    });
    return { ...bindings, downloads, uploads };
  };

  describe("when downloading", () => {
    it("should report a 100 byte body that arrives in two pieces up to 100%", async () => {
      const { onResponseStart, onResponseProgress, onResponseEnd, downloads } = await setup();

      onResponseStart();
      onResponseProgress({ total: 100, loaded: 50 });
      onResponseProgress({ total: 100, loaded: 100 });
      onResponseEnd();

      expect(downloads).toEqual([
        { loaded: 0, total: 1, progress: 0 },
        { loaded: 50, total: 100, progress: 50 },
        { loaded: 100, total: 100, progress: 100 },
      ]);
    });

    it("should keep reporting a body without a known size after exactly 100 bytes", async () => {
      const { onResponseStart, onResponseProgress, onResponseEnd, downloads } = await setup();

      onResponseStart();
      // Without a content length the adapter reports the received size as the total
      onResponseProgress({ total: 100, loaded: 100 });
      onResponseProgress({ total: 120, loaded: 120 });
      onResponseProgress({ total: 150, loaded: 150 });
      onResponseEnd();

      expect(downloads.map(({ loaded }) => loaded)).toEqual([0, 100, 120, 150]);
    });

    it.each([1, 50, 99, 100, 101, 1000])("should report the same events for a %i byte body", async (size) => {
      const { onResponseStart, onResponseProgress, onResponseEnd, downloads } = await setup();

      onResponseStart();
      onResponseProgress({ total: size, loaded: Math.floor(size / 2) });
      onResponseProgress({ total: size, loaded: size });
      onResponseEnd();

      expect(downloads.at(-1)).toEqual({ loaded: size, total: size, progress: 100 });
      // 1 byte bodies have no half, so the middle event repeats the start
      expect(downloads).toHaveLength(size === 1 ? 2 : 3);
    });

    it("should never report more than 100% when the body is bigger than its announced size", async () => {
      const { onResponseStart, onResponseProgress, onResponseEnd, downloads } = await setup();

      // A compressed body: the size from the headers is smaller than the decompressed bytes counted by the adapter
      onResponseStart({ total: 100, loaded: 0 });
      onResponseProgress({ total: 100, loaded: 80 });
      onResponseProgress({ total: 100, loaded: 400 });
      onResponseProgress({ total: 100, loaded: 1000 });
      onResponseEnd();

      expect(downloads.every(({ progress }) => progress <= 100)).toBeTrue();
      expect(downloads.at(-1)).toEqual({ loaded: 1000, total: 1000, progress: 100 });
    });

    it("should not report the same progress twice in a row", async () => {
      const { onResponseStart, onResponseProgress, onResponseEnd, downloads } = await setup();

      onResponseStart();
      onResponseProgress({ total: 10, loaded: 5 });
      onResponseProgress({ total: 10, loaded: 5 });
      onResponseProgress({ total: 10, loaded: 10 });
      onResponseEnd();
      onResponseEnd();

      expect(downloads.map(({ loaded }) => loaded)).toEqual([0, 5, 10]);
    });
  });

  describe("when uploading", () => {
    it.each([99, 100, 101])("should report a %i byte payload up to 100%", async (size) => {
      const { onRequestStart, onRequestProgress, onRequestEnd, uploads } = await setup();

      onRequestStart({ total: size, loaded: 0 });
      onRequestProgress({ total: size, loaded: Math.floor(size / 2) });
      onRequestProgress({ total: size, loaded: size });
      onRequestEnd();

      expect(uploads).toEqual([
        { loaded: 0, total: size, progress: 0 },
        { loaded: Math.floor(size / 2), total: size, progress: Math.round((Math.floor(size / 2) * 100) / size) },
        { loaded: size, total: size, progress: 100 },
      ]);
    });

    it("should keep reporting after a 100 byte upload event", async () => {
      const { onRequestStart, onRequestProgress, onRequestEnd, uploads } = await setup();

      onRequestStart();
      onRequestProgress({ total: 100, loaded: 100 });
      onRequestProgress({ total: 300, loaded: 200 });
      onRequestEnd();

      expect(uploads.map(({ loaded, total }) => [loaded, total])).toEqual([
        [0, 1],
        [100, 100],
        [200, 300],
        [300, 300],
      ]);
    });
  });
});
