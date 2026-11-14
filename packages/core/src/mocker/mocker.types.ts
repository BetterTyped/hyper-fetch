import type { AdapterInstance, ResponseType } from "adapter";

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type MockerConfigType = {
  /** Informs how long the request should take before returning a timeout error (in milliseconds) */
  timeout?: number;
  /** Simulates how long the request to the server should take (in milliseconds) */
  requestTime?: number;
  /** Indicates how long the response from the server should take (in milliseconds).
   * If their combined total takes longer than provided timeout, each value will be automatically
   * adjusted to last half of the timeout time */
  responseTime?: number;
  /** total number of 'bytes' to be uploaded. */
  totalUploaded?: number;
  /** total number of 'bytes' to be downloaded. */
  totalDownloaded?: number;
  /** Delay before each streamed chunk (in milliseconds) when the mock returns `chunks`. Defaults to 0. */
  chunkTime?: number;
};

/** Body chunks emitted one by one as response-chunk events, like a real streamed response (e.g. SSE or LLM tokens). */
export type MockChunksType = (string | Uint8Array)[];

/** Shape of a mocked response returned from the mocker. Must include either `data` (success) or `error` (failure). */
export type MockResponseType<Response, Error, AdapterType extends AdapterInstance> = PartialBy<
  Omit<ResponseType<Response, Error, AdapterType>, "data" | "error" | "responseTimestamp" | "requestTimestamp">,
  "extra" | "success"
> &
  (
    | {
        data: Response;
        error?: Error;
        chunks?: MockChunksType;
      }
    | {
        data?: Response;
        error: Error;
        chunks?: MockChunksType;
      }
    | {
        /**
         * Stream these chunks before resolving. When `data` is omitted, the joined chunk text becomes the
         * response data (parsed as JSON when possible).
         */
        chunks: MockChunksType;
        data?: Response;
        error?: Error;
      }
  );
