import { ClientInstance } from "@hyper-fetch/core";
import { renderHook } from "@testing-library/react";

import { useAppManager } from "hooks/use-app-manager";

export const renderUseAppManager = <B extends ClientInstance>(client: B) => {
  return renderHook(() => {
    return useAppManager(client);
  });
};
