import { AdapterInstance, ResponseType } from "adapter";
import { SyncOrAsync } from "types";

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type MockerConfigType = {
  timeout?: boolean;
  requestTime?: number;
  responseTime?: number;
  totalUploaded?: number;
  totalDownloaded?: number;
};

export type MockResponseType<Response, Error, AdapterType extends AdapterInstance> = SyncOrAsync<
  PartialBy<
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
    )
>;
