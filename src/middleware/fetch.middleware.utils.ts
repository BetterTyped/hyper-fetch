import { ProgressEvent } from "./fetch.middleware.types";

export const apiProgressUtils = ({ loaded, total }: ProgressEvent): number => {
  return Number(((total * 100) / loaded).toFixed(0));
};

export const apiEtaUtils = (
  startDate: Date,
  { total, loaded }: ProgressEvent,
): { sizeLeft: number; timeLeft: number } => {
  const timeElapsed = +new Date() - +startDate;
  const uploadSpeed = loaded / timeElapsed;
  const sizeLeft = total - loaded;
  const timeLeft = sizeLeft / uploadSpeed;
  return { timeLeft, sizeLeft };
};

export const getProgressData = (requestStartTime: Date, progressEvent: ProgressEvent) => {
  const { total, loaded } = progressEvent;
  if (!total || !loaded) {
    return {
      progress: 0,
      timeLeft: 0,
      sizeLeft: 0,
    };
  }

  return {
    progress: apiProgressUtils(progressEvent),
    ...apiEtaUtils(requestStartTime, progressEvent),
  };
};
