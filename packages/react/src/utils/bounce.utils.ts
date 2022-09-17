export const getBounceData = (bounceData: {
  reset: () => void;
  active: boolean;
}): { reset: () => void; active: boolean } => {
  return {
    ...bounceData,
    ...{ throttle: undefined, debounce: undefined },
  };
};
