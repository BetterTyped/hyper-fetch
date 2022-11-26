import { renderHook } from "@testing-library/react";
import { EmitterInstance } from "@hyper-fetch/sockets";

import { useEmitter, UseEmitterOptionsType } from "hooks/use-Emitter";

export const renderUseEmitter = <T extends EmitterInstance>(Emitter: T, options?: UseEmitterOptionsType) => {
  return renderHook((rerenderOptions: UseEmitterOptionsType & { Emitter?: EmitterInstance }) => {
    const { Emitter: lst, ...rest } = rerenderOptions || {};
    return useEmitter(lst || Emitter, { dependencyTracking: false, ...options, ...rest });
  });
};
