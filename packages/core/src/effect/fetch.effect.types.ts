import { CommandInstance } from "command";
import { ClientResponseErrorType, ClientResponseType, ClientResponseSuccessType } from "client";
import { FetchEffect } from "effect";
import { ExtractError } from "types";

export type FetchEffectLifecycle = "trigger" | "start" | "success" | "error" | "finished";

export type FetchEffectInstance = FetchEffect<CommandInstance>;

export type FetchEffectConfig<T extends CommandInstance> = {
  /**
   * It should match effectKey on the command for which given effect should be triggered.
   */
  effectKey: string;
  /**
   * Callback that will be executed when request gets triggered
   */
  onTrigger?: (command: CommandInstance) => void;
  /**
   * Callback that will be executed when request starts
   */
  onStart?: (command: CommandInstance) => void;
  /**
   * Callback that will be executed when response is successful
   */
  onSuccess?: (response: ClientResponseSuccessType<ResponseType>, command: CommandInstance) => void;
  /**
   * Callback that will be executed when response is failed
   */
  onError?: (response: ClientResponseErrorType<ExtractError<T>>, command: CommandInstance) => void;
  /**
   * Callback that will be executed when response is finished
   */
  onFinished?: (response: ClientResponseType<ResponseType, ExtractError<T>>, command: CommandInstance) => void;
};
