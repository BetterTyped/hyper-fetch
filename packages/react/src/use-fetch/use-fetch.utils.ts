export const getRefreshTime = (refreshTime: number, dataTimestamp?: Date) => {
  if (dataTimestamp) {
    const timeDiff = Date.now() - +dataTimestamp;
    return timeDiff < refreshTime ? refreshTime - timeDiff : refreshTime;
  }
  return refreshTime;
};
