import type { EmitterInstance } from "@hyper-fetch/sockets";
import { renderHook } from "@testing-library/react";
import type { UseEmitterOptionsType } from "hooks/use-emitter";
import { useEmitter } from "hooks/use-emitter";

export const renderUseEmitter = <T extends EmitterInstance>(Emitter: T, options?: UseEmitterOptionsType) => {
  return renderHook((rerenderOptions: UseEmitterOptionsType & { emitter?: EmitterInstance }) => {
    const { emitter: lst, ...rest } = rerenderOptions || {};
    return useEmitter((lst || Emitter) as T, { dependencyTracking: false, ...options, ...rest });
  });
};
