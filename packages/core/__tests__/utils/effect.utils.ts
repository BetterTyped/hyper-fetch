import { RequestEffect, RequestEffectOptionsType } from "effect";
import { RequestInstance } from "request";

export const createEffect = (
  request: RequestInstance,
  options?: Partial<Omit<RequestEffectOptionsType<RequestInstance>, "effectKey">>,
) => {
  return new RequestEffect({ ...options, effectKey: request.effectKey });
};
