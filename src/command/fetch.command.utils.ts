import { ClientProgressEvent } from "./fetch.command.types";

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

export const getProgressData = (requestStartTime: Date, progressEvent: ClientProgressEvent) => {
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

export const abortControllers = new Map<string, AbortController>();

export const getAbortKey = (method: string, baseUrl: string, endpoint: string): string => {
  return `${method}_${baseUrl}${endpoint}`;
};

export const addAbortController = (key: string) => {
  const existingController = abortControllers.get(key);
  if (!existingController || existingController?.signal?.aborted) {
    abortControllers.set(key, new AbortController());
  }
};

export const abortCommand = (key: string) => {
  abortControllers.get(key)?.abort();
  addAbortController(key);
};

export const getAbortController = (key: string) => {
  return abortControllers.get(key);
};
