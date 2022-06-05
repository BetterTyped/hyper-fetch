import { CommandInstance } from "command";
import { ClientResponseErrorType, ClientResponseType, ClientResponseSuccessType } from "client";
import { FetchEffect } from "effect";
import { ExtractError } from "types";

export type FetchEffectLifecycle = "trigger" | "start" | "success" | "error" | "finished";

export type FetchEffectInstance = FetchEffect<CommandInstance>;

export type FetchEffectConfig<T extends CommandInstance> = {
  effectKey: string;
  onTrigger?: (command: CommandInstance) => void;
  onStart?: (command: CommandInstance) => void;
  onSuccess?: (response: ClientResponseSuccessType<ResponseType>, command: CommandInstance) => void;
  onError?: (response: ClientResponseErrorType<ExtractError<T>>, command: CommandInstance) => void;
  onFinished?: (response: ClientResponseType<ResponseType, ExtractError<T>>, command: CommandInstance) => void;
};
