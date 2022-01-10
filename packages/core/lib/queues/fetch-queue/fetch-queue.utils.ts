export const getFetchLoadingEventKey = (key: string): string => {
  return `${key}-fetch-loading-event`;
};

export const getIsEqualTimestamp = (currentTimestamp: number, threshold: number, queueTimestamp?: number): boolean => {
  if (!queueTimestamp) {
    return false;
  }

  return queueTimestamp - currentTimestamp <= threshold;
};
