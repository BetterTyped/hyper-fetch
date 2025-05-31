import { RequestInstance, getProgressValue, getRequestEta } from "request";

export const testProgressSpy = (props: {
  spy: () => void;
  requestId: string;
  request: RequestInstance;
  startTimestamp: number;
  progressTimestamp?: number;
  total?: number;
  loaded?: number;
  timeLeft?: number;
}) => {
  const { spy, requestId, request, startTimestamp, total, loaded, timeLeft, progressTimestamp } = props;

  const totalValue = total ?? 1;
  const loadedValue = loaded ?? 0;

  const estimatedTime = getRequestEta(new Date(startTimestamp), new Date(progressTimestamp || startTimestamp), {
    total: totalValue,
    loaded: loadedValue,
  }).timeLeft;
  const timeToSend = loadedValue ? estimatedTime : null;

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith({
    request,
    requestId,

    loaded: loadedValue,
    progress: getProgressValue({ total: totalValue, loaded: loadedValue }),
    sizeLeft: totalValue - loadedValue,
    startTimestamp,
    timeLeft: timeLeft ?? timeToSend,
    total: totalValue,
  });
};
