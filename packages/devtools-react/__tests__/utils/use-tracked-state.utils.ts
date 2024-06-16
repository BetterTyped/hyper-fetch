import { RequestInstance } from "@hyper-fetch/core";
import { renderHook } from "@testing-library/react";

import { useTrackedState, UseTrackedStateProps } from "helpers";
import { isEqual } from "utils";

export const renderUseTrackedState = <Request extends RequestInstance>(
  request: Request,
  options?: Partial<UseTrackedStateProps<Request>>,
) => {
  const { client } = request;
  const { fetchDispatcher: dispatcher, loggerManager } = client;

  const logger = loggerManager.init("test");
  return renderHook(() => {
    return useTrackedState({
      logger,
      request,
      dispatcher,
      initialData: null,
      deepCompare: isEqual,
      dependencyTracking: false,
      ...options,
    });
  });
};
