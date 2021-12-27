import { FetchBuilderInstance } from "builder";
import { FetchProgressType } from "client";
import { ClientProgressEvent, FetchCommandInstance } from "command";

export const fetchProgressUtils = ({ loaded, total }: ClientProgressEvent): number => {
  return Number(((total * 100) / loaded).toFixed(0));
};

export const fetchEtaUtils = (
  startDate: Date,
  { total, loaded }: ClientProgressEvent,
): { sizeLeft: number; timeLeft: number } => {
  const timeElapsed = +new Date() - +startDate;
  const uploadSpeed = loaded / timeElapsed;
  const sizeLeft = total - loaded;
  const timeLeft = sizeLeft / uploadSpeed;
  return { timeLeft, sizeLeft };
};

export const getProgressData = (requestStartTime: Date, progressEvent: ClientProgressEvent): FetchProgressType => {
  const { total, loaded } = progressEvent;
  if (!total || !loaded) {
    return {
      progress: 0,
      timeLeft: 0,
      sizeLeft: 0,
    };
  }

  const { timeLeft, sizeLeft } = fetchEtaUtils(requestStartTime, progressEvent);

  return {
    progress: fetchProgressUtils(progressEvent),
    timeLeft,
    sizeLeft,
  };
};

// Abort
export const getAbortKey = (method: string, baseUrl: string, endpoint: string): string => {
  return `${method}_${baseUrl}${endpoint}`;
};

export const addAbortController = (builder: FetchBuilderInstance, key: string) => {
  const { abortControllers } = builder.commandManager;

  const existingController = abortControllers.get(key);
  if (!existingController || existingController?.signal?.aborted) {
    abortControllers.set(key, new AbortController());
  }
};

export const abortCommand = (builder: FetchBuilderInstance, key: string, command: FetchCommandInstance) => {
  const { abortControllers } = builder.commandManager;
  abortControllers.get(key)?.abort();
  builder.commandManager.events.emitAbort(key, command);
  addAbortController(builder, key);
};

export const getAbortController = (builder: FetchBuilderInstance, key: string) => {
  const { abortControllers } = builder.commandManager;
  return abortControllers.get(key);
};
