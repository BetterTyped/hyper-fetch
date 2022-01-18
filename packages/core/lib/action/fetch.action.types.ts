import { FetchCommandInstance } from "command";
import { ClientResponseErrorType, ClientResponseType, ClientResponseSuccessType } from "client";
import { FetchAction } from "action";
import { ExtractError, ExtractRequestError } from "types";

export type FetchActionLifecycle = "trigger" | "start" | "success" | "error" | "finished";

export type FetchActionInstance = FetchAction<FetchCommandInstance>;

export type FetchActionConfig<T extends FetchCommandInstance> = {
  name: string;
  on: {
    trigger?: (command: FetchCommandInstance) => void;
    start?: (command: FetchCommandInstance) => void;
    success?: (response: ClientResponseSuccessType<ResponseType>, command: FetchCommandInstance) => void;
    error?: (
      response: ClientResponseErrorType<ExtractError<T> & ExtractRequestError<T>>,
      command: FetchCommandInstance,
    ) => void;
    finished?: (
      response: ClientResponseType<ResponseType, ExtractError<T> & ExtractRequestError<T>>,
      command: FetchCommandInstance,
    ) => void;
  };
};
