import { AxiosAdapter } from "@hyper-fetch/axios";
import { createClient } from "@hyper-fetch/core";
import type { AxiosError } from "axios";

/**
 * The Axios adapter sends requests with XMLHttpRequest in the browser, which reports upload progress.
 * Everything else (requests, hooks, cache) stays the same as with the default fetch adapter.
 */
export const client = createClient<{ error: AxiosError }>({ url: "https://httpbin.org" }).setAdapter(AxiosAdapter);

/** httpbin rejects bodies above about 1 MB with 413, so the example keeps files under that. */
export const maxFileSize = 1024 * 1024;

/** httpbin echoes the request. `headers["Content-Length"]` tells how many bytes it received. */
export const uploadFileRequest = client.createRequest<{
  response: { headers: Record<string, string>; files: Record<string, string> };
  payload: FormData;
}>()({
  endpoint: "/post",
  method: "POST",
});
