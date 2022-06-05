import { CommandInstance, getProgressValue, getRequestEta } from "command";

export const testProgressSpy = (props: {
  spy: () => void;
  requestId: string;
  command: CommandInstance;
  startTimestamp: number;
  progressTimestamp?: number;
  total?: number;
  loaded?: number;
  timeLeft?: number;
}) => {
  const { spy, requestId, command, startTimestamp, total, loaded, timeLeft, progressTimestamp } = props;

  const totalValue = total ?? 1;
  const loadedValue = loaded ?? 0;

  const estimatedTime = getRequestEta(new Date(startTimestamp), new Date(progressTimestamp || startTimestamp), {
    total: totalValue,
    loaded: loadedValue,
  }).timeLeft;
  const timeToSend = loadedValue ? estimatedTime : null;

  expect(spy).toBeCalledTimes(1);
  expect(spy).toBeCalledWith(
    {
      loaded: loadedValue,
      progress: getProgressValue({ total: totalValue, loaded: loadedValue }),
      sizeLeft: totalValue - loadedValue,
      startTimestamp,
      timeLeft: timeLeft ?? timeToSend,
      total: totalValue,
    },
    {
      command,
      requestId,
    },
  );
};
