import { RequestInstance } from "@hyper-fetch/core";
import { renderHook } from "@testing-library/react";

import { useTrackedState, useRequestEvents, UseRequestEventsPropsType, UseTrackedStateProps } from "helpers";
import { isEqual } from "utils";

export const renderUseRequestEvents = <Request extends RequestInstance>(
  request: Request,
  options?: Partial<UseRequestEventsPropsType<Request>>,
  trackedOptions?: Partial<UseTrackedStateProps<Request>>,
) => {
  const { client } = request;
  const { fetchDispatcher: dispatcher, loggerManager } = client;

  const logger = loggerManager.initialize(client, "test");

  const { result } = renderHook(() => {
    return useTrackedState({
      logger,
      request,
      dispatcher,
      initialResponse: null,
      deepCompare: isEqual,
      dependencyTracking: false,
      ...trackedOptions,
    });
  });
  const [, actions, { setCacheData, getIsDataProcessing }] = result.current;

  return renderHook((args?: Partial<Parameters<typeof useRequestEvents>[0]>) => {
    return useRequestEvents({
      logger,
      actions,
      dispatcher,
      setCacheData,
      getIsDataProcessing,
      ...options,
      ...args,
      request,
    });
  });
};
