import { AdapterInstance, ResponseType } from "adapter";

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type MockerConfigType = {
  /** Informs whether it should return a timeout error */
  timeout?: boolean;
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
};

export type MockResponseType<Response, Error, AdapterType extends AdapterInstance> = PartialBy<
  Omit<ResponseType<Response, Error, AdapterType>, "data" | "error" | "responseTimestamp" | "requestTimestamp">,
  "extra" | "success"
> &
  (
    | {
        data: Response;
        error?: Error;
      }
    | {
        data?: Response;
        error: Error;
      }
  );
