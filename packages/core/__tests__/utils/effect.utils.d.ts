import { FetchEffect, FetchEffectConfig } from "effect";
import { CommandInstance } from "command";
export declare const createEffect: (
  command: CommandInstance,
  options?: Partial<Omit<FetchEffectConfig<CommandInstance>, "effectKey">>,
) => FetchEffect<CommandInstance>;
