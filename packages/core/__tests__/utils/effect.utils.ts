import { FetchEffect, FetchEffectConfig } from "effect";
import { FetchCommandInstance } from "command";

export const createEffect = (
  command: FetchCommandInstance,
  options?: Partial<Omit<FetchEffectConfig<FetchCommandInstance>, "effectKey">>,
) => {
  return new FetchEffect({ ...options, effectKey: command.effectKey });
};
