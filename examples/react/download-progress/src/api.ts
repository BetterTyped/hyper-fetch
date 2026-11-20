import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://httpbin.org" });

/** 1 MB, the largest file httpbin's `/range` endpoint sends. */
export const fileSize = 1024 * 1024;

/**
 * httpbin sends `:size` letters spread over `duration` seconds, with a `Content-Length` header, so the percentage is
 * exact. The default fetch adapter reads the body chunk by chunk and reports each chunk as download progress.
 */
export const downloadFileRequest = client.createRequest<{
  response: string;
  queryParams: { duration: number; chunk_size: number };
}>()({
  endpoint: "/range/:size",
  // A download is used once. Keeping a 1 MB string in the cache would only use memory.
  cache: false,
  // The fetch adapter's timeout (5 s by default) covers the whole download. A slow file needs more.
  options: { timeout: 60_000 },
});
