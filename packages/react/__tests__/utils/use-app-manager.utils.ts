import { BuilderInstance } from "@better-typed/hyper-fetch";
import { renderHook } from "@testing-library/react";
import { useAppManager } from "use-app-manager";

export const renderUseAppManager = <B extends BuilderInstance>(builder: B) => {
  return renderHook(() => {
    return useAppManager(builder);
  });
};
