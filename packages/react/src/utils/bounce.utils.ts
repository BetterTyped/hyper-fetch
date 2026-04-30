export const getBounceData = (bounceData: {
  reset: () => void;
  active: boolean;
}): { reset: () => void; active: boolean } => {
  return {
    ...bounceData,
    // oxlint-disable-next-line unicorn/no-useless-spread
    ...{ throttle: undefined, debounce: undefined },
  };
};
