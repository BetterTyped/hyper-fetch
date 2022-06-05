import { FetchEffect, FetchEffectConfig } from "effect";
import { CommandInstance } from "command";

export const createEffect = (
  command: CommandInstance,
  options?: Partial<Omit<FetchEffectConfig<CommandInstance>, "effectKey">>,
) => {
  return new FetchEffect({ ...options, effectKey: command.effectKey });
};
