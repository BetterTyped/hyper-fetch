import { ClientProgressEvent } from "./fetch.middleware.types";

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

  return {
    progress: fetchProgressUtils(progressEvent),
    ...fetchEtaUtils(requestStartTime, progressEvent),
  };
};
