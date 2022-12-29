import { RequestInstance } from "@hyper-fetch/core";
import { renderHook } from "@testing-library/react";

import { useTrackedState, useRequestEvents, UseRequestEventsPropsType, UseTrackedStateProps } from "helpers";
import { isEqual } from "utils";

export const renderUseRequestEvents = <Request extends RequestInstance>(
  request: Request,
  options?: UseRequestEventsPropsType<Request>,
  trackedOptions?: UseTrackedStateProps<Request>,
) => {
  const { client } = request;
  const { fetchDispatcher: dispatcher, loggerManager } = client;

  const logger = loggerManager.init("test");

  const { result } = renderHook(() => {
    return useTrackedState({
      logger,
      request,
      dispatcher,
      initialData: null,
      deepCompare: isEqual,
      dependencyTracking: false,
      ...trackedOptions,
    });
  });
  const [, actions, { setCacheData }] = result.current;

  return renderHook(() => {
    return useRequestEvents({ logger, actions, request, dispatcher, setCacheData, ...options });
  });
};
